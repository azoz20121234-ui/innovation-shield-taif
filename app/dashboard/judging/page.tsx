"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type Idea = {
  id: string
  title: string
  state: string
  final_judging_score?: number | null
}

type Criterion = {
  id: string
  criterion: string
  weight: number
}

type EvaluatorScore = {
  evaluator: string
  role: string
  weightedScore: number
}

type FinalReport = {
  averageScore: number
  preJudgingScore: number | null
  evaluatorNotes: string[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

type JudgingSummary = {
  criteria: Criterion[]
  evaluatorScores: EvaluatorScore[]
  averageScore: number
  finalReport?: FinalReport
}

const stateBadge: Record<string, string> = {
  prototype_ready: "جاهز لتحكيم AI",
  ai_judged: "جاهز لتحكيم بشري",
  human_judged: "مكتمل التحكيم",
}

export default function JudgingPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>("")
  const [summary, setSummary] = useState<JudgingSummary | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadIdeas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ideas")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحميل الأفكار")

      const filtered = (json.data || []).filter((idea: Idea) =>
        ["prototype_ready", "ai_judged", "human_judged"].includes(idea.state)
      )

      setIdeas(filtered)
      if (!selectedIdeaId && filtered[0]?.id) setSelectedIdeaId(filtered[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }, [selectedIdeaId])

  const loadSummary = useCallback(async (ideaId: string) => {
    if (!ideaId) return

    try {
      const res = await fetch(`/api/judging?ideaId=${ideaId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحميل ملخص التحكيم")

      setSummary(json.data)
      const initialScores: Record<string, number> = {}
      const initialComments: Record<string, string> = {}
      ;(json.data.criteria || []).forEach((c: Criterion) => {
        initialScores[c.id] = 70
        initialComments[c.id] = ""
      })
      setScores(initialScores)
      setComments(initialComments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }, [])

  useEffect(() => {
    void loadIdeas()
  }, [loadIdeas])

  useEffect(() => {
    if (selectedIdeaId) {
      void loadSummary(selectedIdeaId)
    }
  }, [selectedIdeaId, loadSummary])

  useEffect(() => {
    const timer = setInterval(() => {
      void loadIdeas()
      if (selectedIdeaId) {
        void loadSummary(selectedIdeaId)
      }
    }, 30000)

    return () => clearInterval(timer)
  }, [loadIdeas, loadSummary, selectedIdeaId])

  const selectedIdea = useMemo(() => ideas.find((idea) => idea.id === selectedIdeaId), [ideas, selectedIdeaId])

  const localWeightedScore = useMemo(() => {
    if (!summary) return 0
    const totalWeight = summary.criteria.reduce((sum, item) => sum + Number(item.weight), 0)
    if (!totalWeight) return 0

    const weighted = summary.criteria.reduce((sum, item) => {
      return sum + Number(scores[item.id] || 0) * Number(item.weight)
    }, 0)

    return Math.round((weighted / totalWeight) * 100) / 100
  }, [summary, scores])

  const submitEvaluation = async (role: "ai" | "human") => {
    if (!selectedIdeaId || !summary) return

    setSaving(true)
    setError(null)

    try {
      const body = {
        ideaId: selectedIdeaId,
        evaluatorId: role === "ai" ? "ai-engine" : "committee-01",
        evaluatorName: role === "ai" ? "Innovation AI" : "محكم اللجنة",
        evaluatorRole: role,
        scores: summary.criteria.map((c) => ({
          criterionId: c.id,
          score: Number(scores[c.id] || 0),
          comments: comments[c.id] || undefined,
        })),
      }

      const res = await fetch("/api/judging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر حفظ التقييم")

      await loadSummary(selectedIdeaId)
      await loadIdeas()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const runAutoPreJudging = async () => {
    if (!selectedIdeaId) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/judging/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: selectedIdeaId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تنفيذ التحكيم الأولي الآلي")

      await loadIdeas()
      await loadSummary(selectedIdeaId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const approveForExecution = async () => {
    if (!selectedIdeaId) return

    setSaving(true)
    try {
      const res = await fetch(`/api/ideas/${selectedIdeaId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toState: "approved_for_execution",
          actorId: "committee-chair",
          actorRole: "committee",
          action: "IDEA_APPROVED_FOR_EXECUTION",
          notes: "Approved after judging",
          pmName: "PMO Office",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر اعتماد الفكرة")

      await loadIdeas()
      await loadSummary(selectedIdeaId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const exportFinalReport = () => {
    if (!summary?.finalReport || !selectedIdea) return

    const payload = {
      idea: selectedIdea,
      report: summary.finalReport,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `final-judging-report-${selectedIdea.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">نظام التحكيم الكامل</h1>
        <p className="mt-2 text-sm text-slate-300">
          تحكيم أولي آلي قبل البشري + تقرير نهائي للمبتكر يرفع جودة الأفكار ويقلل زمن التحكيم.
        </p>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <label className="mb-2 block text-sm text-slate-300">اختر الفكرة للتحكيم</label>
        {loading ? (
          <p className="text-slate-300">جارٍ التحميل...</p>
        ) : (
          <select
            value={selectedIdeaId}
            onChange={(e) => setSelectedIdeaId(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          >
            {ideas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.title} - {stateBadge[idea.state] || idea.state}
              </option>
            ))}
          </select>
        )}
      </section>

      {selectedIdea && summary && (
        <>
          <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-100">معايير التقييم وأوزانها</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={runAutoPreJudging}
                  disabled={saving || selectedIdea.state !== "prototype_ready"}
                  className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs text-violet-200 disabled:opacity-50"
                >
                  تحكيم أولي آلي
                </button>
                <button
                  onClick={exportFinalReport}
                  className="rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200"
                >
                  تصدير التقرير النهائي
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {summary.criteria.map((criterion) => (
                <div key={criterion.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <p className="text-sm font-semibold text-slate-100">{criterion.criterion}</p>
                  <p className="mt-1 text-xs text-slate-400">الوزن: {criterion.weight}%</p>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={scores[criterion.id] ?? 70}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [criterion.id]: Number(e.target.value),
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
                  />
                  <textarea
                    value={comments[criterion.id] || ""}
                    onChange={(e) =>
                      setComments((prev) => ({
                        ...prev,
                        [criterion.id]: e.target.value,
                      }))
                    }
                    placeholder="ملاحظة المحكّم"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-xs text-slate-100"
                    rows={2}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">
              الدرجة المرجحة الحالية: {localWeightedScore}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={saving}
                onClick={() => submitEvaluation("ai")}
                className="rounded-2xl bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? "جارٍ الحفظ..." : "تحكيم AI يدوي"}
              </button>
              <button
                disabled={saving}
                onClick={() => submitEvaluation("human")}
                className="rounded-2xl bg-sky-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? "جارٍ الحفظ..." : "تحكيم بشري"}
              </button>
              <button
                disabled={saving || selectedIdea.state !== "human_judged"}
                onClick={approveForExecution}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                اعتماد للتنفيذ
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
            <h2 className="text-xl font-semibold text-slate-100">سجل تقييم كل محكم</h2>
            <div className="mt-4 space-y-2">
              {summary.evaluatorScores.length === 0 ? (
                <p className="text-sm text-slate-400">لا يوجد تقييمات بعد.</p>
              ) : (
                summary.evaluatorScores
                  .slice()
                  .sort((a, b) => b.weightedScore - a.weightedScore)
                  .map((entry, idx) => (
                    <div key={`${entry.evaluator}-${idx}`} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                      <p className="text-sm text-slate-200">
                        {entry.evaluator} ({entry.role}) - {entry.weightedScore}
                      </p>
                    </div>
                  ))
              )}
            </div>
            <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
              <p className="text-sm text-sky-200">متوسط التقييمات: {summary.averageScore}</p>
            </div>
          </section>

          {summary.finalReport && (
            <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <h2 className="text-xl font-semibold text-emerald-100">تقرير التحكيم النهائي للمبتكر</h2>
              <p className="mt-2 text-sm text-emerald-200">
                متوسط التقييم: {summary.finalReport.averageScore} | الدرجة الأولية الآلية: {summary.finalReport.preJudgingScore ?? "-"}
              </p>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-900/20 p-4">
                  <h3 className="text-sm font-semibold text-emerald-100">ملاحظات المحكمين</h3>
                  <ul className="mt-2 space-y-2 text-xs text-emerald-100">
                    {(summary.finalReport.evaluatorNotes || []).map((item, idx) => (
                      <li key={`note-${idx}`} className="rounded-lg bg-emerald-950/40 px-2 py-1.5">{item}</li>
                    ))}
                    {(summary.finalReport.evaluatorNotes || []).length === 0 && <li>لا توجد ملاحظات نصية بعد.</li>}
                  </ul>
                </div>

                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-900/20 p-4">
                  <h3 className="text-sm font-semibold text-emerald-100">نقاط القوة</h3>
                  <ul className="mt-2 space-y-2 text-xs text-emerald-100">
                    {(summary.finalReport.strengths || []).map((item, idx) => (
                      <li key={`st-${idx}`} className="rounded-lg bg-emerald-950/40 px-2 py-1.5">{item}</li>
                    ))}
                  </ul>

                  <h3 className="mt-4 text-sm font-semibold text-emerald-100">نقاط الضعف</h3>
                  <ul className="mt-2 space-y-2 text-xs text-emerald-100">
                    {(summary.finalReport.weaknesses || []).map((item, idx) => (
                      <li key={`wk-${idx}`} className="rounded-lg bg-emerald-950/40 px-2 py-1.5">{item}</li>
                    ))}
                    {(summary.finalReport.weaknesses || []).length === 0 && <li>لا توجد نقاط ضعف حرجة حالياً.</li>}
                  </ul>

                  <h3 className="mt-4 text-sm font-semibold text-emerald-100">توصيات التحسين</h3>
                  <ul className="mt-2 space-y-2 text-xs text-emerald-100">
                    {(summary.finalReport.recommendations || []).map((item, idx) => (
                      <li key={`rc-${idx}`} className="rounded-lg bg-emerald-950/40 px-2 py-1.5">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
