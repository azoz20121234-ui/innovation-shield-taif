import { NextResponse } from "next/server"
import { DEMO_SESSION_COOKIE } from "@/lib/auth/demoAccess"

export async function GET(req: Request) {
  const redirectUrl = new URL("/", req.url)
  const response = NextResponse.redirect(redirectUrl)

  response.cookies.set({
    name: DEMO_SESSION_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  })
  response.cookies.set({
    name: "role",
    value: "",
    path: "/",
    maxAge: 0,
  })

  return response
}
