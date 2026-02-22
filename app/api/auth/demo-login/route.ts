import { NextResponse } from "next/server"
import { DEMO_SESSION_COOKIE, encodeDemoSession, parseLegacyRole } from "@/lib/auth/demoAccess"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const role = parseLegacyRole(body?.role)
    if (!role) {
      return NextResponse.json({ error: "Invalid demo role" }, { status: 400 })
    }

    const response = NextResponse.json({ ok: true, role })
    response.cookies.set({
      name: DEMO_SESSION_COOKIE,
      value: encodeDemoSession(role),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 12 * 60 * 60,
    })

    response.cookies.set({
      name: "role",
      value: role,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 12 * 60 * 60,
    })

    return response
  } catch {
    return NextResponse.json({ error: "Failed to create demo session" }, { status: 500 })
  }
}
