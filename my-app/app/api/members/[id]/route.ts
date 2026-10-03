import { NextResponse, NextRequest } from "next/server"
import connectToDatabase from "../../../../lib/mongoose"
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
    const jwt = require('jsonwebtoken')
    jwt.verify(token, JWT_SECRET)
    return true
  } catch (e) {
    return false
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!requireAuth(request)) return unauthorized()
  const payload = await request.json().catch(() => ({}))
  delete payload.id
  delete payload._id
  delete payload.createdAt
  delete payload.updatedAt
  if (payload.socials && typeof payload.socials === "object") {
    payload.socials = {
      github: String(payload.socials.github || "").trim(),
      linkedin: String(payload.socials.linkedin || "").trim(),
      twitter: String(payload.socials.twitter || "").trim(),
      instagram: String(payload.socials.instagram || "").trim(),
    }
  }
  await connectToDatabase()
  const updated = await Member.findById(id)
  if (!updated) return NextResponse.json({ error: "Member not found" }, { status: 404 })
  updated.set(payload)
  if (payload.socials) updated.markModified("socials")
  await updated.save()
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!requireAuth(request)) return unauthorized()
  await connectToDatabase()
  await Member.findByIdAndDelete(id)
  return new NextResponse(null, { status: 204 })
}
