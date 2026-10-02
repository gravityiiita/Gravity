import nodemailer from "nodemailer"
import { geminiApiKey, generateWithGemini } from "@/lib/gemini"

export const runtime = "nodejs"

type ModerationVerdict = {
  approved: boolean
  verdict: "approve" | "reject"
  reason?: string
  issues?: string[]
  sanitized_message?: string
}

type DeliverabilityResult = {
  ok: boolean
  reason?: string
  issues?: string[]
}

const MODERATION_SYSTEM_PROMPT = `You are a strict content safety and quality reviewer for a public contact form.

Return ONLY a compact JSON object with these keys:
{
  "approved": boolean,
  "verdict": "approve" | "reject",
  "reason": string,
  "issues": string[],
  "sanitized_message": string
}

Rules:
- Approve only if the message is polite, non-harmful, non-spam, and relevant to contacting Gravity.
- Reject if it contains hate, threats, harassment, explicit content, self-harm, scams, ads/spam, sensitive personal data, or anything unsafe/irrelevant.
- "issues" should list short bullet reasons when rejecting; empty array when approving.
- "sanitized_message" must remove links, phone numbers, and emails not in the original sender field, while keeping the useful body text. If nothing needs sanitizing, return the original message.
- NEVER return code fences or extra text. Output JSON only.`

type ProgressEvent = {
  step: "validating" | "moderating" | "checkingEmail" | "sending" | "done"
  status: "active" | "error" | "done"
  ok?: boolean
  error?: string
  id?: string
}

export async function POST(request: Request) {
  const { name, email, message } = await request.json().catch(() => ({ name: "", email: "", message: "" }))

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const send = (event: ProgressEvent) => {
        if (closed) return
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }
      const fail = (step: ProgressEvent["step"], error: string) => {
        send({ step, status: "error", ok: false, error })
      }

      try {
        send({ step: "validating", status: "active" })
        const trimmedName = String(name || "").trim()
        const trimmedEmail = String(email || "").trim()
        const trimmedMessage = String(message || "").trim()
        if (!trimmedName || !trimmedEmail || !trimmedMessage) {
          fail("validating", "Missing name, email or message")
          return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          fail("validating", "Please enter a valid email address")
          return
        }

        send({ step: "moderating", status: "active" })
        let moderation: ModerationVerdict
        try {
          moderation = await runModeration({ name: trimmedName, email: trimmedEmail, message: trimmedMessage })
        } catch (err: any) {
          fail("moderating", err?.message || "Moderation failed")
          return
        }
        if (!moderation.approved) {
          fail("moderating", moderation.reason || "Message rejected by safety filter")
          return
        }

        send({ step: "checkingEmail", status: "active" })
        let deliver: DeliverabilityResult
        try {
          deliver = await checkEmailDeliverability(trimmedEmail)
        } catch (err: any) {
          fail("checkingEmail", err?.message || "Email verification failed")
          return
        }
        if (!deliver.ok) {
          fail("checkingEmail", deliver.reason || "Email could not be verified")
          return
        }

        const safeMessage = moderation.sanitized_message?.trim() || trimmedMessage
        send({ step: "sending", status: "active" })
        try {
          const id = await sendContactEmail({
            name: trimmedName,
            email: trimmedEmail,
            message: safeMessage,
          })
          send({ step: "done", status: "done", ok: true, id })
        } catch (err: any) {
          console.error("Contact email send failed", err)
          fail("sending", err?.message || "Failed to send")
        }
      } catch (err: any) {
        console.error("Contact request failed", err)
        fail("sending", err?.message || "Failed to send")
      } finally {
        closed = true
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}

async function sendContactEmail(payload: { name: string; email: string; message: string }) {
  const host = process.env.CONTACT_SMTP_HOST || process.env.SMTP_HOST || "smtp.gmail.com"
  const port = Number(process.env.CONTACT_SMTP_PORT || process.env.SMTP_PORT || 587)
  const user = process.env.CONTACT_SMTP_USER || process.env.SMTP_USER
  const pass = process.env.CONTACT_SMTP_PASS || process.env.SMTP_PASS
  const to = process.env.CONTACT_TO || "raghavvohra375@gmail.com"
  const from = process.env.CONTACT_FROM || `Gravity Contact <${user}>`

  if (!user || !pass) {
    throw new Error("SMTP user/pass not configured")
  }

  const cleanUser = user.trim()
  const cleanPass = pass.trim()

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
  })

  try {
    await transporter.verify()
  } catch (err: any) {
    console.error("Contact SMTP verify failed - Full error:", err)
    throw new Error(
      `SMTP Authentication Failed: Check your email credentials or app password. Error: ${err?.message || "Unknown error"}`,
    )
  }

  const subject = `New Contact Form Submission from ${payload.name}`
  const html = `
  <div style="
    font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    line-height:1.6;
    background:#f6f8fb;
    padding:16px;
  ">

    <div style="
      max-width:520px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid #e5e7eb;
      border-radius:6px;
      padding:16px;
      color:#111;
    ">

      <h2 style="
        margin:0 0 12px;
        font-size:18px;
        font-weight:600;
        color:#1f2937;
      ">
        Contact Form Submission
      </h2>

      <p style="margin:6px 0;color:#374151">
        <strong style="color:#111">Name:</strong> ${escapeHtml(payload.name)}
      </p>

      <p style="margin:6px 0;color:#374151">
        <strong style="color:#111">Email:</strong> ${escapeHtml(payload.email)}
      </p>

      <p style="margin:12px 0 6px;color:#111">
        <strong>Message:</strong>
      </p>

      <div style="
        white-space:pre-line;
        padding:10px 12px;
        background:#f9fafb;
        border-left:4px solid #2563eb;
        color:#1f2937;
      ">
        ${escapeHtml(payload.message)}
      </div>

      <p style="
        margin-top:16px;
        font-size:12px;
        color:#6b7280;
      ">
        — Gravity Website
      </p>

    </div>

  </div>
`

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    replyTo: payload.email,
  })
  return info.messageId
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

async function runModeration(payload: { name: string; email: string; message: string }): Promise<ModerationVerdict> {
  if (!geminiApiKey()) {
    console.warn("[contact] moderation skipped - missing API key")
    return {
      approved: false,
      verdict: "reject",
      reason: "Moderation service not configured",
      issues: ["Missing GEMINI_API_KEY"],
      sanitized_message: payload.message,
    }
  }

  const userContent = JSON.stringify({
    sender_name: payload.name,
    sender_email: payload.email,
    message: payload.message,
  })

  let raw = ""
  try {
    raw = await generateWithGemini({
      system: MODERATION_SYSTEM_PROMPT,
      user: userContent,
      maxOutputTokens: 1024,
      json: true,
    })
  } catch (err) {
    console.error("[contact] moderation call failed", err)
    return {
      approved: false,
      verdict: "reject",
      reason: "Moderation service unavailable",
      issues: ["LLM call failed"],
      sanitized_message: payload.message,
    }
  }

  const parsed = parseModerationJson(raw)
  const normalized = normalizeModeration(parsed, payload.message)
  return normalized
}

async function checkEmailDeliverability(email: string): Promise<DeliverabilityResult> {
  const apiKey =
    process.env.EMAIL_VALIDATION_API_KEY ||
    process.env.NEXT_PUBLIC_EMAIL_VALIDATION_API_KEY ||
    ""

  if (!apiKey) {
    console.warn("[contact] email validation skipped - missing API key")
    return {
      ok: false,
      reason: "Email validation service not configured",
      issues: ["Missing EMAIL_VALIDATION_API_KEY"],
    }
  }

  const url = `https://emailreputation.abstractapi.com/v1?api_key=${apiKey}&email=${encodeURIComponent(email)}`
  try {
    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Validation failed: ${res.status} ${text}`)
    }
    const data = (await res.json()) as any
    const status = data?.email_deliverability?.status

    if (status === "undeliverable") {
      return {
        ok: false,
        reason: "The email you provided was undeliverable",
        issues: ["Email marked undeliverable"],
      }
    }

    return { ok: true }
  } catch (err: any) {
    const msg = err?.message || "Email validation failed"
    const isNetwork = typeof msg === "string" && /fetch failed|EAI_AGAIN|ENOTFOUND/i.test(msg)
    if (isNetwork) {
      return {
        ok: true,
        issues: ["Email validation skipped due to network error"],
      }
    }
    return {
      ok: false,
      reason: msg,
      issues: ["Email validation request errored"],
    }
  }
}

function parseModerationJson(raw: string): Partial<ModerationVerdict> {
  try {
    return JSON.parse(raw)
  } catch {}

  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {}
  }

  return {}
}

function normalizeModeration(data: Partial<ModerationVerdict> | undefined, fallbackMessage: string): ModerationVerdict {
  const approvedFlag = data?.approved === true || data?.verdict === "approve"
  const verdict: ModerationVerdict["verdict"] = data?.verdict === "reject" ? "reject" : approvedFlag ? "approve" : "reject"
  const reason =
    typeof data?.reason === "string" && data.reason.trim()
      ? data.reason.trim()
      : verdict === "approve"
        ? "Approved"
        : "Rejected by policy"

  const issues = Array.isArray(data?.issues)
    ? data.issues.map((item) => String(item)).filter(Boolean).slice(0, 5)
    : []

  const sanitized =
    typeof data?.sanitized_message === "string" && data.sanitized_message.trim()
      ? data.sanitized_message.trim()
      : fallbackMessage

  return {
    approved: verdict === "approve" && approvedFlag,
    verdict,
    reason,
    issues,
    sanitized_message: sanitized,
  }
}
