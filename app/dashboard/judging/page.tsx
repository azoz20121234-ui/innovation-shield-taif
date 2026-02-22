"use client"

import { useCallback, useEffect, useState } from "react"

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

type JudgingSummary = {
  criteria: Criterion[]
  evaluatorScores: EvaluatorScore[]
  averageScore: number
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

  const loadSummary = async (ideaId: string) => {
    if (!ideaId) return

    try {
      const res = await fetch(`/api/judging?ideaId=${ideaId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحميل ملخص التحكيم")

      setSummary(json.data)
      const initial: Record<string, number> = {}
      ;(json.data.criteria || []).forEach((c: Criterion) => {
        initial[c.id] = 70
      })
      setScores(initial)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  useEffect(() => {
    void loadIdeas()
  }, [loadIdeas])

  useEffect(() => {
    if (selectedIdeaId) {
      void loadSummary(selectedIdeaId)
    }
  }, [selectedIdeaId])

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

  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId)

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">نظام التحكيم الكامل</h1>
        <p className="mt-2 text-sm text-slate-300">
          نماذج تقييم + أوزان معايير + سجل تقييم كل محكم + متوسط التقييمات، وكل تقييم مسجل في audit log.
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
            <h2 className="text-xl font-semibold text-slate-100">معايير التقييم وأوزانها</h2>
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
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={saving}
                onClick={() => submitEvaluation("ai")}
                className="rounded-2xl bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? "جارٍ الحفظ..." : "تحكيم AI"}
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
                summary.evaluatorScores.map((entry, idx) => (
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
        </>
      )}
    </div>
  )
}
