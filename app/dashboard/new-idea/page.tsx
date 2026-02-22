"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"

type ChallengeOption = {
  id: string
  title: string
}

type AttachmentInput = {
  fileName: string
  fileType: string
  fileSize: number
  fileData: string
}

type AiAssistResponse = {
  suggestedTitle: string
  refinedDescription: string
  valueAnalysis: string[]
  riskScan: string[]
  impactKpis: string[]
  qualityScore: number
}

type IdeaForm = {
  title: string
  challengeId: string
  problemStatement: string
  proposedSolution: string
  addedValue: string
  targetAudience: string
  expectedImpact: string
  potentialRisks: string
  maturityLevel: "idea" | "concept" | "prototype"
  selfClarity: number
  selfReadiness: number
  selfFeasibility: number
}

const defaultForm: IdeaForm = {
  title: "",
  challengeId: "",
  problemStatement: "",
  proposedSolution: "",
  addedValue: "",
  targetAudience: "",
  expectedImpact: "",
  potentialRisks: "",
  maturityLevel: "idea",
  selfClarity: 3,
  selfReadiness: 3,
  selfFeasibility: 3,
}

const ideaExamples: Array<{ label: string; apply: Partial<IdeaForm> }> = [
  {
    label: "مثال فكرة تقنية",
    apply: {
      title: "التنبؤ الذكي بالازدحام في العيادات",
      problemStatement: "تفاوت أوقات الانتظار في العيادات يسبب ضغطًا تشغيليًا وتراجع رضا المستفيدين.",
      proposedSolution: "نموذج تنبؤي يربط المواعيد والتدفق اللحظي ويقترح توزيعًا ديناميكيًا للكوادر.",
      addedValue: "خفض وقت الانتظار وتحسين استغلال الموارد السريرية.",
      targetAudience: "المرضى وفرق التشغيل في العيادات الخارجية.",
      expectedImpact: "خفض متوسط الانتظار بنسبة 20% خلال 3 أشهر.",
      potentialRisks: "دقة البيانات الأولية وتكامل الأنظمة.",
      maturityLevel: "concept",
    },
  },
  {
    label: "مثال فكرة تشغيلية",
    apply: {
      title: "مسار موحد لإدارة البلاغات التشغيلية",
      problemStatement: "تتكرر البلاغات التشغيلية عبر قنوات متعددة دون أولوية واضحة أو تتبع موحد.",
      proposedSolution: "لوحة مركزية تصنف البلاغات تلقائيًا وتربطها بفرق التنفيذ ومؤشرات الالتزام.",
      addedValue: "تقليل زمن الاستجابة وتحسين الشفافية بين الإدارات.",
      targetAudience: "الإدارات التشغيلية وفرق الجودة.",
      expectedImpact: "تقليل زمن إغلاق البلاغات الحرجة بنسبة 30%.",
      potentialRisks: "مقاومة التغيير وعدم اكتمال البيانات.",
      maturityLevel: "idea",
    },
  },
  {
    label: "مثال تجربة مريض",
    apply: {
      title: "رحلة رقمية للمريض قبل الموعد",
      problemStatement: "نسبة كبيرة من المواعيد تتأخر بسبب عدم جاهزية المريض قبل الوصول.",
      proposedSolution: "تجربة رقمية ترسل تعليمات ذكية قبل الموعد وتتحقق من الجاهزية.",
      addedValue: "تحسين الالتزام بالمواعيد وتقليل التأخير في بداية الجلسات.",
      targetAudience: "المرضى ومقدمو الخدمة.",
      expectedImpact: "رفع الالتزام الزمني للمواعيد إلى 90%.",
      potentialRisks: "تفاوت الوصول الرقمي لبعض الفئات.",
      maturityLevel: "concept",
    },
  },
]

function qualityColor(score: number) {
  if (score >= 75) return "text-emerald-300"
  if (score >= 50) return "text-amber-300"
  return "text-rose-300"
}

function localQualityScore(form: IdeaForm) {
  const fields = [
    form.title,
    form.problemStatement,
    form.proposedSolution,
    form.addedValue,
    form.targetAudience,
    form.expectedImpact,
    form.potentialRisks,
  ]

  let score = 0
  fields.forEach((value) => {
    const length = value.trim().length
    if (length >= 30) score += 12
    else if (length >= 15) score += 8
    else if (length > 0) score += 4
  })

  score += Math.round((form.selfClarity + form.selfReadiness + form.selfFeasibility) * 1.5)
  return Math.max(0, Math.min(100, score))
}

async function fileToDataUrl(file: File) {
  const result = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("تعذر قراءة الملف"))
    reader.readAsDataURL(file)
  })
  return result
}

export default function NewIdeaPage() {
  const [form, setForm] = useState<IdeaForm>(defaultForm)
  const [challenges, setChallenges] = useState<ChallengeOption[]>([])
  const [attachments, setAttachments] = useState<AttachmentInput[]>([])
  const [aiResult, setAiResult] = useState<AiAssistResponse | null>(null)
  const [ideaQualityScore, setIdeaQualityScore] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const res = await fetch("/api/challenges")
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || "تعذر تحميل التحديات")
        setChallenges((json.data || []).map((row: { id: string; title: string }) => ({ id: row.id, title: row.title })))
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذر تحميل التحديات")
      }
    }

    void loadChallenges()
  }, [])

  const computedQuality = useMemo(() => {
    if (ideaQualityScore !== null) return ideaQualityScore
    return localQualityScore(form)
  }, [form, ideaQualityScore])

  const completionPercent = useMemo(() => {
    const requiredLike = [
      form.title,
      form.problemStatement,
      form.proposedSolution,
      form.addedValue,
      form.targetAudience,
      form.expectedImpact,
      form.potentialRisks,
    ]
    const filled = requiredLike.filter((x) => x.trim().length > 0).length
    return Math.round((filled / requiredLike.length) * 100)
  }, [form])

  const updateForm = (patch: Partial<IdeaForm>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setIdeaQualityScore(null)
  }

  const applyExample = (example: Partial<IdeaForm>) => {
    updateForm(example)
    setMessage("تم تطبيق المثال ويمكنك التعديل عليه قبل الإرسال")
    setError(null)
  }

  const handleAssist = async () => {
    setAiLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch("/api/ideas/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تشغيل مساعد الابتكار")

      const data = json.data as AiAssistResponse
      setAiResult(data)
      setIdeaQualityScore(Number(data.qualityScore || 0))

      updateForm({
        title: data.suggestedTitle || form.title,
        expectedImpact: data.impactKpis?.join("\n") || form.expectedImpact,
        potentialRisks: data.riskScan?.join("\n") || form.potentialRisks,
        addedValue: data.valueAnalysis?.join("\n") || form.addedValue,
      })

      if ((data.refinedDescription || "").trim()) {
        const refined = data.refinedDescription.trim()
        if (!form.problemStatement.trim()) {
          updateForm({ problemStatement: refined })
        }
      }

      setMessage("تم تحليل الفكرة وتحديث الحقول المقترحة من مساعد الابتكار")
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تشغيل المساعد")
    } finally {
      setAiLoading(false)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError(null)
    const selected = Array.from(files).slice(0, 5 - attachments.length)
    if (selected.length === 0) {
      setError("الحد الأقصى للمرفقات 5 ملفات")
      return
    }

    try {
      const nextItems: AttachmentInput[] = []
      for (const file of selected) {
        if (file.size > 1_500_000) {
          setError(`الملف ${file.name} أكبر من الحد المسموح (1.5MB)`)
          continue
        }

        const fileData = await fileToDataUrl(file)
        nextItems.push({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          fileData,
        })
      }

      setAttachments((prev) => [...prev, ...nextItems].slice(0, 5))
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر معالجة المرفقات")
    }
  }

  const removeAttachment = (name: string) => {
    setAttachments((prev) => prev.filter((item) => item.fileName !== name))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (!form.title.trim() || !form.problemStatement.trim() || !form.proposedSolution.trim()) {
        throw new Error("يرجى تعبئة العنوان والمشكلة والحل المقترح على الأقل")
      }

      const payload = {
        ...form,
        description: `${form.problemStatement}\n\nالحل المقترح:\n${form.proposedSolution}`,
        ideaQualityScore: computedQuality,
        attachments,
        ownerName: "مبتكر من منصة درع الابتكار",
      }

      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء الفكرة")

      setMessage("تم إنشاء الفكرة بنجاح وإرسالها لمسار التحسين والتحكيم")
      setForm(defaultForm)
      setAttachments([])
      setAiResult(null)
      setIdeaQualityScore(null)
      setPreviewMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إنشاء الفكرة")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">منصة درع الابتكار</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-100">إنشاء فكرة ابتكارية جديدة</h1>
        <p className="mt-2 text-sm text-slate-300">نموذج شامل لبناء فكرة قوية قابلة للتحكيم والتنفيذ مع دعم مساعد ابتكار ذكي.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
            <p className="text-xs text-slate-400">اكتمال الحقول</p>
            <p className="mt-1 text-xl font-semibold text-cyan-300">{completionPercent}%</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
            <p className="text-xs text-slate-400">Idea Quality Score</p>
            <p className={`mt-1 text-xl font-semibold ${qualityColor(computedQuality)}`}>{computedQuality}/100</p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
            <p className="text-xs text-slate-400">وضع المراجعة</p>
            <button
              type="button"
              onClick={() => setPreviewMode((v) => !v)}
              className="mt-2 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-100 hover:border-cyan-400"
            >
              {previewMode ? "العودة للتعديل" : "فتح Preview Mode"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-700/40 bg-cyan-950/20 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-cyan-200">مساعد الابتكار الذكي</p>
          <button
            type="button"
            onClick={handleAssist}
            disabled={aiLoading}
            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {aiLoading ? "جاري التحليل..." : "تحسين الفكرة بالذكاء الاصطناعي"}
          </button>
        </div>
        <p className="mt-2 text-xs text-cyan-100/90">يقترح عنوانًا أفضل، يحسّن الوصف، يحلل القيمة والمخاطر، ويقترح مؤشرات أثر تلقائيًا.</p>
        {aiResult && (
          <div className="mt-3 rounded-xl border border-cyan-700/50 bg-slate-950/40 p-3 text-sm text-slate-200">
            <p className="font-medium text-cyan-200">ملخص AI</p>
            <p className="mt-1 text-xs">عنوان مقترح: {aiResult.suggestedTitle || "-"}</p>
            <p className="mt-1 text-xs">درجة الجودة: {aiResult.qualityScore}/100</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 rounded-3xl border border-slate-700 bg-slate-900/65 p-6 md:grid-cols-2"
        >
          <label className="space-y-2">
            <span className="text-sm text-slate-200">عنوان الفكرة</span>
            <input
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              placeholder="مثال: نظام ذكي لتقليل زمن انتظار المرضى"
              className="w-full rounded-xl border border-slate-600 bg-slate-950/50 p-3 text-sm text-slate-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">التحدي المرتبط (اختياري)</span>
            <select
              value={form.challengeId}
              onChange={(e) => updateForm({ challengeId: e.target.value })}
              className="w-full rounded-xl border border-slate-600 bg-slate-950/50 p-3 text-sm text-slate-100"
            >
              <option value="">اختر التحدي</option>
              {challenges.map((challenge) => (
                <option key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-200">المشكلة الحالية</span>
            <textarea
              value={form.problemStatement}
              onChange={(e) => updateForm({ problemStatement: e.target.value })}
              placeholder="ما المشكلة التشغيلية أو السريرية الحالية؟ وما أثرها؟"
              className="h-24 w-full rounded-xl border border-slate-600 bg-slate-950/50 p-3 text-sm text-slate-100"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-200">الحل المقترح</span>
            <textarea
              value={form.proposedSolution}
              onChange={(e) => updateForm({ proposedSolution: e.target.value })}
              placeholder="ما الذي ستنفذه لحل المشكلة؟"
              className="h-24 w-full rounded-xl border border-slate-600 bg-slate-950/50 p-3 text-sm text-slate-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">القيمة المضافة</span>
            <textarea
              value={form.addedValue}
              onChange={(e) => updateForm({ addedValue: e.target.value })}
              placeholder="كيف تختلف الفكرة عن الوضع الحالي؟"
              className="h-24 w-full rounded-xl border border-slate-600 bg-slate-950/50 p-3 text-sm text-slate-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">الفئة المستهدفة</span>
            <textarea
              value={form.targetAudience}
              onChange={(e) => updateForm({ targetAudience: e.target.value })}
              placeholder="المرضى، الممارسون الصحيون، الإدارات التشغيلية..."
              className="h-24 w-full rounded-xl border border-slate-600 bg-slate-950/50 p-3 text-sm text-slate-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">الأثر المتوقع</span>
            <textarea
              value={form.expectedImpact}
              onChange={(e) => updateForm({ expectedImpact: e.target.value })}
              placeholder="مثال: خفض زمن الانتظار 20% خلال 90 يوم"
              className="h-24 w-full rounded-xl border border-slate-600 bg-slate-950/50 p-3 text-sm text-slate-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">المخاطر المحتملة</span>
            <textarea
              value={form.potentialRisks}
              onChange={(e) => updateForm({ potentialRisks: e.target.value })}
              placeholder="خصوصية البيانات، التكامل، التبني التشغيلي..."
              className="h-24 w-full rounded-xl border border-slate-600 bg-slate-950/50 p-3 text-sm text-slate-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-200">مستوى النضج</span>
            <select
              value={form.maturityLevel}
              onChange={(e) => updateForm({ maturityLevel: e.target.value as IdeaForm["maturityLevel"] })}
              className="w-full rounded-xl border border-slate-600 bg-slate-950/50 p-3 text-sm text-slate-100"
            >
              <option value="idea">Idea</option>
              <option value="concept">Concept</option>
              <option value="prototype">Prototype</option>
            </select>
          </label>

          <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-950/35 p-4 md:col-span-2">
            <p className="text-sm font-medium text-slate-100">التقييم الذاتي للفكرة</p>
            {[{ key: "selfClarity", label: "مدى وضوح الفكرة" }, { key: "selfReadiness", label: "مدى جاهزية الفكرة" }, { key: "selfFeasibility", label: "مدى قابلية التنفيذ" }].map((item) => (
              <label key={item.key} className="block space-y-1">
                <span className="text-xs text-slate-300">{item.label}: {form[item.key as keyof IdeaForm] as number}/5</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form[item.key as keyof IdeaForm] as number}
                  onChange={(e) => updateForm({ [item.key]: Number(e.target.value) } as Partial<IdeaForm>)}
                  className="w-full"
                />
              </label>
            ))}
          </div>
        </motion.div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900/65 p-6">
          <div className="flex flex-wrap gap-2">
            {ideaExamples.map((example) => (
              <button
                key={example.label}
                type="button"
                onClick={() => applyExample(example.apply)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-400"
              >
                {example.label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm text-slate-100">المرفقات (حتى 5 ملفات)</p>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.ppt,.pptx,.doc,.docx"
              onChange={(e) => void handleFiles(e.target.files)}
              className="block w-full text-xs text-slate-300"
            />
            <div className="space-y-2">
              {attachments.map((file) => (
                <div key={file.fileName} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                  <span>{file.fileName} ({Math.round(file.fileSize / 1024)} KB)</span>
                  <button type="button" onClick={() => removeAttachment(file.fileName)} className="text-rose-300 hover:text-rose-200">حذف</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {previewMode && (
          <div className="rounded-3xl border border-emerald-700/40 bg-emerald-950/15 p-6 text-sm text-slate-200">
            <p className="text-base font-semibold text-emerald-300">Preview Mode</p>
            <p className="mt-2">العنوان: {form.title || "-"}</p>
            <p className="mt-1">المشكلة: {form.problemStatement || "-"}</p>
            <p className="mt-1">الحل: {form.proposedSolution || "-"}</p>
            <p className="mt-1">القيمة: {form.addedValue || "-"}</p>
            <p className="mt-1">الفئة المستهدفة: {form.targetAudience || "-"}</p>
            <p className="mt-1">الأثر المتوقع: {form.expectedImpact || "-"}</p>
            <p className="mt-1">المخاطر: {form.potentialRisks || "-"}</p>
            <p className="mt-1">مستوى النضج: {form.maturityLevel}</p>
            <p className="mt-1">درجة الجودة: {computedQuality}/100</p>
            <p className="mt-1">عدد المرفقات: {attachments.length}</p>
          </div>
        )}

        {error && <p className="rounded-xl border border-rose-700/50 bg-rose-950/30 px-4 py-2 text-sm text-rose-200">{error}</p>}
        {message && <p className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-200">{message}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {loading ? "جاري الإرسال..." : "إرسال الفكرة"}
          </button>
          <p className="text-xs text-slate-400">معيار القبول الأولي: وضوح المشكلة + حل قابل للتنفيذ + أثر قابل للقياس.</p>
        </div>
      </form>
    </div>
  )
}
