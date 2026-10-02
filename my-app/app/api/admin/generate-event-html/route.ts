import { NextResponse } from "next/server";
import { generateWithGemini, geminiApiKey } from "@/lib/gemini";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "Unauthorized" },
    { status: 401 },
  );
}

function requireAuth(request: Request) {
  const auth = request.headers.get("authorization");
  const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
  if (!auth) return false;
  try {
    const token = auth.replace("Bearer ", "");
    const jwt = require("jsonwebtoken");
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

const SYSTEM_PROMPT = `You are a deterministic HTML formatter and email-safe visual designer.

Your task:
Transform the given plain-text event description into a polished, readable HTML fragment
that renders correctly and consistently in BOTH:
1) modern web pages (especially dark-themed websites)
2) HTML email clients (Gmail, Outlook, Apple Mail — light and dark modes)

The output will be injected directly inside a <td> whose background-color
will be explicitly defined by the caller.

========================
ABSOLUTE OUTPUT RULES
========================
- Output ONLY valid HTML. No explanations or markdown.
- Do NOT include <html>, <head>, <body>, or <style> tags.
- All CSS MUST be inline via the style attribute.
- The output must be fully self-contained and readable without external CSS.

========================
ALLOWED HTML TAGS ONLY
========================
<p>, <br>
<strong>, <em>, <b>, <i>, <u>
<ul>, <ol>, <li>
<a>
<span>

========================
DISALLOWED HTML TAGS
========================
<div>, <table>, <section>, <article>, <header>, <footer>
<img>, <video>, <iframe>
<style>, <script>, <link>

========================
CSS SAFETY RULES (EMAIL-PROOF)
========================
ONLY the following CSS properties are allowed:
- color
- font-size
- font-weight
- font-style
- line-height
- text-align
- border
- padding
- text-decoration

EXPLICITLY FORBIDDEN CSS:
- background-color (NEVER set background color on any tag)
- border-radius (NEVER use rounded corners)
- display (flex, grid, inline-block, etc.)
- position
- margin
- width / height
- max-width / min-width
- float / clear
- box-shadow
- opacity or rgba()
- gradients
- animations or transitions

========================
TEXT COLOR & CONTRAST RULES
========================
- DO NOT assume any background color at the element level.
- EVERY text-bearing element (<p>, <li>, <a>, <span>, <strong>) MUST explicitly set a text color.
- Text colors must be light and readable on a dark background.
- Prefer neutral, high-contrast text colors such as:
  #e5e7eb, #f1f5f9, #cbd5f5
- Never rely on inherited text color.

========================
COLOR USAGE RULES
========================
- Use color intentionally to improve clarity and hierarchy.
- Accent colors MAY be applied to:
  - headings or emphasized phrases
  - links
  - important keywords (e.g. dates, prizes, deadlines)
- Use muted, dark-theme-safe accent colors such as:
  #60a5fa, #818cf8, #a5b4fc, #38bdf8
- Avoid neon or overly saturated colors.
- Do NOT overuse colors.
- Never rely on color alone to convey meaning.

========================
STRUCTURE & DESIGN RULES
========================
- Use <p> as the primary block element.
- Minimize the total number of <p> elements when possible.
- Prefer grouping logically related sentences into a single <p>
  and use <br> for internal line breaks instead of creating new paragraphs.
- This reduces default paragraph spacing imposed by email clients.

- Spacing must be achieved using:
  - padding on <p>
  - line-height
- NEVER use margin.

- Borders MAY be used subtly for separation or emphasis
  but must not create boxed sections.

========================
CONTENT FORMATTING RULES
========================
- Preserve the original meaning exactly.
- Do NOT invent, remove, or rephrase factual information.
- Improve readability by:
  - splitting long text into paragraphs ONLY when necessary
  - otherwise using <br> to structure content within a paragraph
  - emphasizing key phrases with <strong>
- Convert enumerations into <ul><li> when appropriate.
- Convert URLs into clickable <a> elements.
- <a> tags MUST include:
  target="_blank"
  rel="noopener noreferrer"
- Do NOT include emojis unless present in the input text.

========================
OUTPUT QUALITY GOAL
========================
The HTML must:
- visually integrate with the surrounding <td> background
- appear cohesive and continuous (not segmented cards)
- remain fully readable in Gmail light and dark modes
- avoid Gmail dark-mode color inversion
- render reliably in Gmail, Outlook, and mobile mail apps
- be safe to inject directly into an email template
- also look good when reused on a dark-themed web page

Return ONLY the formatted HTML fragment.
`;

export async function POST(request: Request) {
  if (!requireAuth(request)) return unauthorized();

  const body = await request.json().catch(() => ({}));
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json(
      { ok: false, error: "Missing text" },
      { status: 400 },
    );
  }

  if (text.length > 12000) {
    return NextResponse.json(
      { ok: false, error: "Text too long" },
      { status: 413 },
    );
  }

  if (!geminiApiKey()) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  try {
    const html = await generateWithGemini({
      system: SYSTEM_PROMPT,
      user: text,
      maxOutputTokens: 4096,
    });

    if (!html) {
      return NextResponse.json(
        { ok: false, error: "Model returned empty HTML" },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, html });
  } catch (err: any) {
    console.error("generate-event-html failed", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate HTML" },
      { status: 500 },
    );
  }
}
