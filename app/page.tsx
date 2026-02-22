"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Noto_Kufi_Arabic } from "next/font/google"
import { Building2, ShieldCheck, Users2, Rocket } from "lucide-react"

const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
})

const roleButtons = [
  {
    key: "innovator",
    label: "مبتكر",
    subtitle: "صياغة فكرة وتحسينها بالذكاء الاصطناعي",
    icon: Building2,
    className: "from-cyan-500/30 to-sky-400/10 border-cyan-400/40 hover:border-cyan-300",
  },
  {
    key: "committee",
    label: "محكم لجنة",
    subtitle: "تقييم متعدد المعايير واعتماد محكوم",
    icon: ShieldCheck,
    className: "from-indigo-500/30 to-violet-400/10 border-indigo-400/40 hover:border-indigo-300",
  },
  {
    key: "pmo",
    label: "PMO",
    subtitle: "متابعة التنفيذ، المخاطر، مؤشرات الإنجاز",
    icon: Rocket,
    className: "from-amber-500/30 to-orange-400/10 border-amber-400/40 hover:border-amber-300",
  },
  {
    key: "management",
    label: "إدارة",
    subtitle: "لوحة قرار استراتيجية وتتبّع الأثر",
    icon: Users2,
    className: "from-emerald-500/30 to-teal-400/10 border-emerald-400/40 hover:border-emerald-300",
  },
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
    <div className={`${kufi.className} relative min-h-screen overflow-hidden bg-[#020617] text-white`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_82%_16%,rgba(16,185,129,0.15),transparent_36%),radial-gradient(circle_at_50%_92%,rgba(14,116,144,0.24),transparent_45%),linear-gradient(180deg,#020617_0%,#031126_42%,#071a34_100%)]" />
      <div className="pointer-events-none absolute -right-28 top-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-8 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-10">
        <div className="w-full overflow-hidden rounded-[32px] border border-white/15 bg-slate-950/45 shadow-2xl shadow-slate-950/60 backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1.08fr_1fr]">
            <section className="relative border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-l">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                وضع العرض التنفيذي
              </div>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
                درع الابتكار
                <span className="mt-2 block text-cyan-300">تجمع الطائف الصحي</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200/90">
                منصة مؤسسية لإدارة رحلة الابتكار من التحدي إلى التنفيذ وحماية الملكية. اختر الدور لتجربة الصلاحيات الفعلية في بيئة عرض.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-xs text-slate-300">دورة الابتكار</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-200">8 مراحل مترابطة</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
                  <p className="text-xs text-slate-300">التحكيم الهجين</p>
                  <p className="mt-1 text-lg font-semibold text-indigo-200">AI + لجنة بشرية</p>
                </div>
              </div>
            </section>

            <section className="p-7 sm:p-10">
              <h2 className="text-2xl font-semibold text-white">اختر دور العرض</h2>
              <p className="mt-2 text-sm text-slate-300">بدون كلمة مرور. بصلاحيات مقيّدة حسب الدور.</p>

              <div className="mt-6 grid gap-3">
                {roleButtons.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.key}
                      onClick={() => void login(item.key)}
                      disabled={Boolean(loadingRole)}
                      className={`group rounded-2xl border bg-gradient-to-l p-4 text-right transition disabled:opacity-60 ${item.className}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-white">
                            {loadingRole === item.key ? "جارٍ الدخول..." : item.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-200/90">{item.subtitle}</p>
                        </div>
                        <div className="rounded-xl border border-white/20 bg-white/10 p-2.5 text-slate-100 transition group-hover:bg-white/15">
                          <Icon size={16} />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                Demo Mode: تمكين عرض الصلاحيات والرحلة الكاملة بدون حسابات إنتاجية.
              </div>
            </section>
          </div>
        </div>

        {error && (
          <p className="fixed bottom-6 left-1/2 w-[min(92vw,520px)] -translate-x-1/2 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2 text-center text-sm text-red-100">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
