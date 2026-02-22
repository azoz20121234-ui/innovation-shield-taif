"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const roleButtons = [
  { key: "innovator", label: "مبتكر", className: "bg-cyan-500 hover:bg-cyan-400" },
  { key: "committee", label: "محكم لجنة", className: "bg-violet-500 hover:bg-violet-400" },
  { key: "pmo", label: "PMO", className: "bg-amber-500 hover:bg-amber-400 text-slate-900" },
  { key: "management", label: "إدارة", className: "bg-emerald-500 hover:bg-emerald-400 text-slate-900" },
]

export default function Login() {
  const router = useRouter()
  const [loadingRole, setLoadingRole] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const login = async (role: string) => {
    setLoadingRole(role)
    setError(null)
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء جلسة الديمو")
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoadingRole(null)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#0b1620] text-white">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border border-white/10 bg-slate-900/60 p-8">
        <h1 className="text-3xl font-semibold">اختر دور العرض</h1>
        <p className="text-sm text-slate-300">Demo Mode: صلاحيات حقيقية بدون كلمة مرور لعرض المشروع.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {roleButtons.map((item) => (
            <button
              key={item.key}
              onClick={() => void login(item.key)}
              disabled={Boolean(loadingRole)}
              className={`rounded-xl px-6 py-3 font-medium transition disabled:opacity-60 ${item.className}`}
            >
              {loadingRole === item.key ? "جارٍ الدخول..." : item.label}
            </button>
          ))}
        </div>
        {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
      </div>
    </div>
  )
}
