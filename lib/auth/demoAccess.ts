export type DemoRole = "innovator" | "committee" | "pmo" | "management"

export const DEMO_SESSION_COOKIE = "demo_session"

type DemoSession = {
  role: DemoRole
  exp: number
}

const roleLabels: Record<DemoRole, string> = {
  innovator: "مبتكر",
  committee: "محكم",
  pmo: "PMO",
  management: "إدارة",
}

const legacyRoleMap: Record<string, DemoRole> = {
  employee: "innovator",
  committee: "committee",
  executive: "pmo",
  management: "management",
}

const roleDashboardAccess: Record<DemoRole, string[]> = {
  innovator: [
    "/dashboard",
    "/dashboard/challenges",
    "/dashboard/new-idea",
    "/dashboard/ideas",
    "/dashboard/ai",
    "/dashboard/idea-ai",
    "/dashboard/kpi",
  ],
  committee: [
    "/dashboard",
    "/dashboard/challenges",
    "/dashboard/ideas",
    "/dashboard/judging",
    "/dashboard/kpi",
  ],
  pmo: [
    "/dashboard",
    "/dashboard/challenges",
    "/dashboard/ideas",
    "/dashboard/teams",
    "/dashboard/tasks",
    "/dashboard/projects",
    "/dashboard/prototypes",
    "/dashboard/kpi",
  ],
  management: ["/dashboard"],
}

function pathMatches(path: string, base: string) {
  return path === base || path.startsWith(`${base}/`)
}

export function isDemoRole(value: string): value is DemoRole {
  return value === "innovator" || value === "committee" || value === "pmo" || value === "management"
}

export function parseLegacyRole(value: string | null | undefined): DemoRole | null {
  if (!value) return null
  if (isDemoRole(value)) return value
  return legacyRoleMap[value] || null
}

export function encodeDemoSession(role: DemoRole, ttlSeconds = 12 * 60 * 60) {
  const payload: DemoSession = {
    role,
    exp: Date.now() + ttlSeconds * 1000,
  }
  return encodeURIComponent(JSON.stringify(payload))
}

export function decodeDemoSession(raw: string | null | undefined): DemoRole | null {
  if (!raw) return null
  try {
    const payload = JSON.parse(decodeURIComponent(raw)) as DemoSession
    if (!payload || !isDemoRole(payload.role)) return null
    if (!Number.isFinite(payload.exp) || payload.exp < Date.now()) return null
    return payload.role
  } catch {
    return null
  }
}

export function canAccessDashboardPath(role: DemoRole, path: string) {
  if (role === "management") return true
  return roleDashboardAccess[role].some((allowedPath) => pathMatches(path, allowedPath))
}

export function canMutateApiPath(role: DemoRole, path: string, method: string) {
  if (role === "management") return true
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true

  if (role === "innovator") {
    if (path.startsWith("/api/ai/")) return true
    if (path === "/api/ideas" || path.startsWith("/api/ideas/assist")) return true
    if (path.startsWith("/api/prototypes")) return true
    if (path.startsWith("/api/tasks/comments")) return true
    return false
  }

  if (role === "committee") {
    if (path.startsWith("/api/judging")) return true
    if (path.match(/^\/api\/ideas\/[^/]+\/transition$/)) return true
    return false
  }

  if (role === "pmo") {
    if (path.startsWith("/api/tasks")) return true
    if (path.startsWith("/api/projects")) return true
    if (path.startsWith("/api/teams")) return true
    if (path.startsWith("/api/team-members")) return true
    if (path.startsWith("/api/tasks/comments")) return true
    if (path.startsWith("/api/challenges")) return true
    return false
  }

  return false
}

export function roleLabel(role: DemoRole | null) {
  if (!role) return "غير محدد"
  return roleLabels[role]
}
