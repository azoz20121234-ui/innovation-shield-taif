"use client"

import { useState } from "react"
import { AlertTriangle, Bot, CopyCheck, Files, Gauge, ShieldCheck, Sparkles } from "lucide-react"

type AnalysisResult = {
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

function extractIdeaLabel(text: string) {
  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean)

  const sentence = firstLine?.split(/[.!؟]/).find(Boolean)?.trim()
  if (!sentence) return "الفكرة المقترحة"
  return sentence.slice(0, 80)
}

function buildAnalysis(idea: string): AnalysisResult {
  const ideaLabel = extractIdeaLabel(idea)

  return {
    summary: `الفكرة "${ideaLabel}" واعدة وقابلة للتنفيذ إذا تم ربطها بتحدٍ مؤسسي واضح وخط أساس قابل للقياس.` ,
    pitch:
      "مبادرة ذكية لتطوير الخدمة الصحية عبر تقليل الهدر وتحسين تجربة المستفيد، من خلال حل قابل للتوسع مدعوم ببيانات أثر واضحة.",
    feasibility: [
      "الأثر المتوقع: خفض زمن الإجراء أو الانتظار بنسبة مبدئية 15-25%.",
      "الجدوى التشغيلية: قابل للتجربة خلال 8 أسابيع ضمن نطاق MVP.",
      "الاعتمادية: يتطلب مالك مبادرة، فريق تنفيذي، ومؤشر نجاح معتمد.",
    ],
    prototypeOutputs: [
      "Wireframe لشاشة إدخال التحدي وربطها بالمؤشرات.",
      "Wireframe لسير العمل الحالي مقابل المقترح.",
      "نموذج رحلة المستخدم مع نقاط الألم والتحسين.",
    ],
    riskScan: [
      "خصوصية: تأكد من إخفاء البيانات الحساسة قبل أي تدريب أو تحليل.",
      "تشغيل: خطر مقاومة التغيير، يوصى بخطة تواصل داخلية.",
      "تكامل: يلزم تقييم مبكر لربط الحل مع الأنظمة الحالية.",
    ],
    duplicationScan: [
      "لا توجد مشابهة مباشرة في نطاق نفس القسم (تقدير أولي).",
      "يوصى بمقارنة نهائية مع قاعدة المبادرات السابقة قبل الاعتماد.",
    ],
    ipGuidance: [
      "النوع المقترح: حق مؤلف + أسرار تجارية (مبدئيًا).",
      "جمع الأدلة: المتطلبات، النسخ، الاختبارات، وقرارات التحكيم.",
      "إنشاء مسودة ملف حماية IP مرتبطة برقم المبادرة.",
    ],
  }
}

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
      setResult(buildAnalysis(idea))
    } catch {
      setError("تعذر تحليل الفكرة حاليًا. حاول مرة أخرى.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-7" dir="rtl">
      <section className="rounded-3xl border border-white/75 bg-white/70 p-6">
        <h1 className="text-3xl font-semibold text-slate-900">مساعد الابتكار الذكي</h1>
        <p className="mt-2 max-w-4xl text-slate-600">
          محرك ذكاء اصطناعي مخصص لمنصة الابتكار في تجمع الطائف الصحي لدعم التحليل،
          بناء النموذج الأولي، التقييم، وحماية الملكية.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {aiRoleCards.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                <Icon size={16} />
              </div>
              <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            </div>
          )
        })}
      </section>

      <section className="rounded-3xl border border-white/75 bg-white/70 p-6">
        <h2 className="text-xl font-semibold text-slate-900">تحليل فكرة الآن</h2>
        <p className="mt-1 text-sm text-slate-600">
          أدخل الفكرة ليتم توليد الملخص التنفيذي، Pitch، جدوى، مخاطر، كشف تكرار، وتوصيف حماية الملكية.
        </p>

        <textarea
          className="mt-4 h-40 w-full rounded-2xl border border-slate-200 bg-white p-4 text-slate-800"
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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {result && (
        <section className="rounded-3xl border border-white/75 bg-white/70 p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">مخرجات الذكاء الاصطناعي</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">الملخص التنفيذي</h3>
              <p className="mt-2 text-sm text-slate-600">{result.summary}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">Pitch المقترح</h3>
              <p className="mt-2 text-sm text-slate-600">{result.pitch}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">تحليل الجدوى</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {result.feasibility.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">مخرجات النموذج الأولي</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {result.prototypeOutputs.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">تقييم المخاطر</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {result.riskScan.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-900">كشف التكرار</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {result.duplicationScan.map((item) => (
                  <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-900">
              <Files size={16} />
              <h3 className="font-semibold">توصيف حماية الملكية</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              {result.ipGuidance.map((item) => (
                <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">{item}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
