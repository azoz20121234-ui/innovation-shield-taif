"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      {/* Glow Background */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500 opacity-20 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600 opacity-20 blur-[140px]" />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,255,255,0.15)]">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wide">
            إنشاء حساب 🚀
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            منصة درع الابتكار
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">

          <div>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-slate-400 backdrop-blur-lg transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="كلمة المرور"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-slate-400 backdrop-blur-lg transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-cyan-500/40 disabled:opacity-50"
          >
            {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Government Innovation System v1.0
        </div>
      </div>
    </div>
  )
}
