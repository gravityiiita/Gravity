import { NextResponse } from "next/server"
import connectToDatabase from "../../../lib/mongoose"
import { Member } from "@/lib/models/member"

export const runtime = "nodejs"

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

function requireAuth(request: Request) {
  const auth = request.headers.get('authorization')
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
  if (!auth) return false
  try {
    const token = auth.replace('Bearer ', '')
    // Lazy require to avoid ESM/CJS interop issues
    const jwt = require('jsonwebtoken')
    jwt.verify(token, JWT_SECRET)
    return true
  } catch (e) {
    return false
  }
}

export async function GET(request: Request) {
  // Admin-only endpoint
  if (!requireAuth(request)) return unauthorized()
  await connectToDatabase().catch((e) => {
    console.error('DB connect failed', e)
    throw e
  })
  const members = await Member.find().sort({ createdAt: -1 })
  return NextResponse.json(members)
}

export async function POST(request: Request) {
  if (!requireAuth(request)) return unauthorized()
  const payload = await request.json().catch(() => ({}))
  if (payload.socials && typeof payload.socials === "object") {
    payload.socials = {
      github: String(payload.socials.github || "").trim(),
      linkedin: String(payload.socials.linkedin || "").trim(),
      twitter: String(payload.socials.twitter || "").trim(),
      instagram: String(payload.socials.instagram || "").trim(),
    }
  }
  await connectToDatabase()
  const created = await Member.create(payload)
  return NextResponse.json(created, { status: 201 })
}
