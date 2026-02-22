"use client"

import { useState } from "react"
import { AlertTriangle, Bot, CopyCheck, Files, Gauge, ShieldCheck, Sparkles } from "lucide-react"

type AnalysisResult = {
  mode?: "live" | "fallback"
  summary: string
  pitch: string
  feasibility: string[]
  prototypeOutputs: string[]
  riskScan: string[]
  duplicationScan: string[]
  ipGuidance: string[]
}

const aiRoleCards = [
  {
    title: "مساعد ابتكار ذكي",
    description: "تحويل وصف الفكرة إلى ملخص تنفيذي وPitch.",
    icon: Bot,
  },
  {
    title: "محلل جدوى تلقائي",
    description: "تقييم الأثر والجدوى والتكرار.",
    icon: Gauge,
  },
  {
    title: "مولد نماذج أولية",
    description: "إنتاج Wireframes ونماذج استخدام قابلة للتعديل.",
    icon: Sparkles,
  },
  {
    title: "مُقَيّم مخاطر",
    description: "كشف مخاطر الخصوصية والتشغيل والتكامل.",
    icon: AlertTriangle,
  },
  {
    title: "كاشف التكرار",
    description: "مقارنة الفكرة بقاعدة داخلية وخارجية لتقليل التكرار.",
    icon: CopyCheck,
  },
  {
    title: "توصيف حماية الملكية",
    description: "اقتراح نوع الحماية وتوليد مسودة ملف رفع.",
    icon: ShieldCheck,
  },
]

export default function AIPage() {
  const [idea, setIdea] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    if (!idea.trim()) {
      setError("يرجى إدخال فكرة أو تحدٍ قبل التحليل.")
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "تعذر تحليل الفكرة حاليًا.")
      }

      setResult(data as AnalysisResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-7" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">مساعد الابتكار الذكي</h1>
        <p className="mt-2 max-w-4xl text-slate-300">
          محرك ذكاء اصطناعي لمنصة الابتكار في تجمع الطائف الصحي لدعم التحليل، بناء
          النموذج الأولي، التقييم، وحماية الملكية.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {aiRoleCards.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <div className="mb-3 inline-flex rounded-xl bg-sky-400/15 p-2 text-sky-300">
                <Icon size={16} />
              </div>
              <h2 className="text-base font-semibold text-slate-100">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-300">{item.description}</p>
            </div>
          )
        })}
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="text-xl font-semibold text-slate-100">تحليل فكرة الآن</h2>
        <p className="mt-1 text-sm text-slate-300">
          أدخل الفكرة ليتم توليد الملخص التنفيذي، Pitch، جدوى، مخاطر، كشف تكرار، وتوصيف حماية الملكية.
        </p>

        <textarea
          className="mt-4 h-40 w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-slate-100"
          placeholder="مثال: منصة لتقليل زمن انتظار المرضى عبر تنسيق ذكي للمواعيد والتحويلات..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />

        <button
          onClick={analyze}
          disabled={loading}
          className="mt-4 rounded-2xl bg-sky-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "جارٍ التحليل..." : "تحليل الفكرة"}
        </button>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}

      {result?.mode === "fallback" && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-400/10 p-4 text-amber-100">
          التحليل يعمل بوضع احتياطي. لإتاحة الربط الحقيقي مع OpenAI أضف `OPENAI_API_KEY` في إعدادات البيئة.
        </div>
      )}

      {result && (
        <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-100">مخرجات الذكاء الاصطناعي</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-slate-100">الملخص التنفيذي</h3>
              <p className="mt-2 text-sm text-slate-300">{result.summary}</p>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-slate-100">Pitch المقترح</h3>
              <p className="mt-2 text-sm text-slate-300">{result.pitch}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-slate-100">تحليل الجدوى</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {result.feasibility.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-950/70 px-3 py-2">{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-slate-100">مخرجات النموذج الأولي</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {result.prototypeOutputs.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-950/70 px-3 py-2">{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-slate-100">تقييم المخاطر</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {result.riskScan.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-950/70 px-3 py-2">{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="font-semibold text-slate-100">كشف التكرار</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {result.duplicationScan.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-950/70 px-3 py-2">{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-100">
              <Files size={16} />
              <h3 className="font-semibold">توصيف حماية الملكية</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              {result.ipGuidance.map((item) => (
                <li key={item} className="rounded-xl bg-slate-950/70 px-3 py-2">{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
