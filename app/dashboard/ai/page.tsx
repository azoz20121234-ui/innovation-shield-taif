"use client"

import { useState } from "react"

type AnalysisResult = {
  summary: string
  improvements: string[]
  prototypeOutputs: string[]
  executionPlan: string[]
  impactMetrics: string[]
  ipSteps: string[]
}

function extractIdeaLabel(text: string) {
  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean)

  const sentence = firstLine?.split(/[.!؟]/).find(Boolean)?.trim()
  if (!sentence) return "الفكرة المقترحة"
  return sentence.slice(0, 70)
}

function buildAnalysis(idea: string): AnalysisResult {
  const ideaLabel = extractIdeaLabel(idea)

  return {
    summary: `المبادرة "${ideaLabel}" قابلة للتنفيذ إذا تم ربطها بتحدٍ مؤسسي واضح، وتحديد خط أساس للمشكلة، ثم بناء نموذج أولي سريع قبل التحكيم.`,
    improvements: [
      "تحديد المشكلة بدقة: ما الأثر الحالي على المرضى أو التشغيل؟",
      "تعيين مؤشر نجاح رئيسي يمكن قياسه خلال 8-12 أسبوعًا.",
      "تقسيم الفكرة إلى نطاق MVP يبدأ بخدمة أو قسم واحد داخل التجمع.",
      "تحديد أصحاب المصلحة: الجهة المالكة، المستخدم النهائي، واللجنة المشرفة.",
    ],
    prototypeOutputs: [
      "Wireframe 1: شاشة تعريف التحدي وربطه بالمؤشرات.",
      "Wireframe 2: سير العمل الحالي مقابل سير العمل المقترح.",
      "Wireframe 3: لوحة متابعة التنفيذ والتنبيهات.",
      "سيناريو اختبار مبدئي مع 5 مستخدمين داخليين.",
    ],
    executionPlan: [
      "الأسبوع 1-2: جمع البيانات الأساسية وتحديد نطاق MVP.",
      "الأسبوع 3-4: تطوير النموذج الأولي وتشغيل اختبار أولي.",
      "الأسبوع 5-6: تحسين الحل ورفع ملف التحكيم (AI + بشري).",
      "الأسبوع 7-8: بدء التنفيذ التجريبي وقياس الأثر الفعلي.",
    ],
    impactMetrics: [
      "نسبة خفض زمن الإجراء المستهدف.",
      "نسبة تقليل الأخطاء أو الهدر التشغيلي.",
      "مستوى رضا المستخدمين الداخليين بعد الإطلاق التجريبي.",
      "زمن الانتقال من فكرة إلى قرار تنفيذ.",
    ],
    ipSteps: [
      "توثيق سجل التطوير وتواريخ النسخ المعتمدة.",
      "حفظ الأدلة: المتطلبات، النماذج، نتائج الاختبار، وقرارات التحكيم.",
      "إنشاء ملف حماية ملكية فكرية ومرجعية ربطه بالمبادرة.",
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
    <div dir="rtl" className="space-y-6">
      <h1 className="text-3xl font-semibold">مساعد الابتكار الذكي</h1>
      <p className="max-w-4xl text-white/70">
        أدخل الفكرة أو التحدي ليقوم المساعد بتوليد مخرجات المرحلة: تحسين الفكرة،
        مكونات نموذج أولي، خطة تنفيذ أولية، ومؤشرات أثر.
      </p>

      <textarea
        className="h-40 w-full rounded-xl border border-white/20 bg-white/10 p-4"
        placeholder="مثال: تقليل وقت انتظار العيادات الخارجية عبر مسار رقمي ذكي..."
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />

      <button
        onClick={analyze}
        disabled={loading}
        className="rounded-xl bg-cyan-500 px-6 py-3 font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "جارٍ التحليل..." : "تحليل الفكرة"}
      </button>

      {error && (
        <div className="rounded-xl border border-red-300/30 bg-red-400/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6">
          <section>
            <h2 className="text-lg font-semibold text-cyan-200">الملخص التنفيذي</h2>
            <p className="mt-2 text-white/80">{result.summary}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-200">تحسينات مقترحة</h2>
            <ul className="mt-2 space-y-2 text-white/80">
              {result.improvements.map((item) => (
                <li key={item} className="rounded-lg bg-black/20 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-200">
              مخرجات النموذج الأولي
            </h2>
            <ul className="mt-2 space-y-2 text-white/80">
              {result.prototypeOutputs.map((item) => (
                <li key={item} className="rounded-lg bg-black/20 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-200">خطة تنفيذ أولية</h2>
            <ul className="mt-2 space-y-2 text-white/80">
              {result.executionPlan.map((item) => (
                <li key={item} className="rounded-lg bg-black/20 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-200">مؤشرات قياس الأثر</h2>
            <ul className="mt-2 space-y-2 text-white/80">
              {result.impactMetrics.map((item) => (
                <li key={item} className="rounded-lg bg-black/20 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-cyan-200">خطوات حماية الملكية</h2>
            <ul className="mt-2 space-y-2 text-white/80">
              {result.ipSteps.map((item) => (
                <li key={item} className="rounded-lg bg-black/20 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
