"use client"

import { useMemo, useState } from "react"
import { getRoleCapabilities, parseLegacyRole, type DemoRole } from "@/lib/auth/demoAccess"

function readCookie(name: string) {
  if (typeof document === "undefined") return null
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
  if (!cookie) return null
  return decodeURIComponent(cookie.split("=")[1] || "")
}

export function useDemoRole() {
  const [role] = useState<DemoRole | null>(() => parseLegacyRole(readCookie("role")))

  const capabilities = useMemo(() => getRoleCapabilities(role), [role])

  return { role, capabilities }
}
