import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  canAccessDashboardPath,
  canMutateApiPath,
  decodeDemoSession,
  DEMO_SESSION_COOKIE,
  parseLegacyRole,
} from "@/lib/auth/demoAccess"

function resolveRole(request: NextRequest) {
  const demoSession = request.cookies.get(DEMO_SESSION_COOKIE)?.value
  const parsed = decodeDemoSession(demoSession)
  if (parsed) return parsed

  const legacyRole = request.cookies.get("role")?.value
  return parseLegacyRole(legacyRole)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDashboardRoute = pathname.startsWith("/dashboard")
  const isApiRoute = pathname.startsWith("/api")
  const isAuthApi = pathname.startsWith("/api/auth/demo-login") || pathname.startsWith("/api/auth/demo-logout")

  if (!isDashboardRoute && !isApiRoute) return NextResponse.next()
  if (isAuthApi) return NextResponse.next()

  const role = resolveRole(request)
  if (!role) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Demo session is required" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (isDashboardRoute && !canAccessDashboardPath(role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (isApiRoute && !canMutateApiPath(role, pathname, request.method)) {
    return NextResponse.json({ error: "Role is not allowed to perform this action" }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
}
