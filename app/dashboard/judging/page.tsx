"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useDemoRole } from "@/lib/auth/useDemoRole"

type Idea = {
  id: string
  title: string
  state: string
  created_at?: string
  latest_ai_score?: number | null
  final_judging_score?: number | null
  challenges?:
    | { id?: string; title?: string | null; department?: string | null }
    | Array<{ id?: string; title?: string | null; department?: string | null }>
    | null
}

type Criterion = {
  id: string
  criterion: string
  weight: number
}

type Evaluation = {
  evaluator_name: string
  evaluator_role: string
  criterion_id: string
  score: number
  comments: string | null
  created_at: string
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
  evaluations: Evaluation[]
  evaluatorScores: EvaluatorScore[]
  averageScore: number
  finalReport?: FinalReport
}

const stateBadge: Record<string, string> = {
  prototype_ready: "جاهز للتحكيم الآلي",
  ai_judged: "جاهز للتحكيم البشري",
  human_judged: "مكتمل التحكيم",
  approved_for_execution: "معتمد للتنفيذ",
}

const stateTone: Record<string, string> = {
  prototype_ready: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  ai_judged: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  human_judged: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  approved_for_execution: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
}

function daysSince(date?: string) {
  if (!date) return 0
  const ms = Date.now() - new Date(date).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

function ideaDepartment(idea: Idea) {
  const relation = Array.isArray(idea.challenges) ? idea.challenges[0] : idea.challenges
  return relation?.department || "غير محدد"
}

function ideaPriority(idea: Idea) {
  const age = daysSince(idea.created_at)
  if (idea.state === "ai_judged" || age > 14) return "عالية"
  if (idea.state === "prototype_ready" || age > 7) return "متوسطة"
  return "منخفضة"
}

export default function JudgingPage() {
  const { capabilities } = useDemoRole()
  const canJudge = capabilities.canJudge
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>("")
  const [summary, setSummary] = useState<JudgingSummary | null>(null)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [stateFilter, setStateFilter] = useState<string>("all")
  const [deptFilter, setDeptFilter] = useState<string>("all")
  const [evaluatorName, setEvaluatorName] = useState("محكم اللجنة")
  const [evaluatorRole, setEvaluatorRole] = useState("committee")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadIdeas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/ideas")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحميل الأفكار")

      const filtered = (json.data || []).filter((idea: Idea) =>
        ["prototype_ready", "ai_judged", "human_judged", "approved_for_execution"].includes(idea.state)
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
      if (selectedIdeaId) void loadSummary(selectedIdeaId)
    }, 30000)

    return () => clearInterval(timer)
  }, [loadIdeas, loadSummary, selectedIdeaId])

  const selectedIdea = useMemo(() => ideas.find((idea) => idea.id === selectedIdeaId), [ideas, selectedIdeaId])

  const departments = useMemo(() => {
    return Array.from(new Set(ideas.map((idea) => ideaDepartment(idea))))
  }, [ideas])

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      if (stateFilter !== "all" && idea.state !== stateFilter) return false
      if (deptFilter !== "all" && ideaDepartment(idea) !== deptFilter) return false
      return true
    })
  }, [ideas, stateFilter, deptFilter])

  const dashboard = useMemo(() => {
    const underJudging = ideas.filter((idea) => ["prototype_ready", "ai_judged"].includes(idea.state))
    const delayed = underJudging.filter((idea) => daysSince(idea.created_at) > 7)
    const avgCycleDays =
      underJudging.length > 0
        ? Math.round(
            underJudging.reduce((sum, idea) => sum + daysSince(idea.created_at), 0) / underJudging.length
          )
        : 0

    return {
      total: ideas.length,
      underJudging: underJudging.length,
      completed: ideas.filter((idea) => idea.state === "human_judged").length,
      delayed: delayed.length,
      avgCycleDays,
    }
  }, [ideas])

  const localWeightedScore = useMemo(() => {
    if (!summary) return 0
    const totalWeight = summary.criteria.reduce((sum, item) => sum + Number(item.weight), 0)
    if (!totalWeight) return 0

    const weighted = summary.criteria.reduce((sum, item) => {
      return sum + Number(scores[item.id] || 0) * Number(item.weight)
    }, 0)

    return Math.round((weighted / totalWeight) * 100) / 100
  }, [summary, scores])

  const submitHumanEvaluation = async () => {
    if (!canJudge) return
    if (!selectedIdeaId || !summary) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const body = {
        ideaId: selectedIdeaId,
        evaluatorId: `human-${evaluatorRole}`,
        evaluatorName,
        evaluatorRole,
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
      if (!res.ok) throw new Error(json.error || "تعذر حفظ التقييم البشري")

      setMessage("تم حفظ التقييم البشري وتحديث متوسط التحكيم")
      await loadSummary(selectedIdeaId)
      await loadIdeas()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const runAutoPreJudging = async () => {
    if (!canJudge) return
    if (!selectedIdeaId) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch("/api/judging/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: selectedIdeaId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تنفيذ التحكيم الأولي الآلي")

      setMessage("تم تنفيذ التحكيم الآلي الأولي وإعادة احتساب النتيجة")
      await loadIdeas()
      await loadSummary(selectedIdeaId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const approveForExecution = async () => {
    if (!canJudge) return
    if (!selectedIdeaId) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`/api/ideas/${selectedIdeaId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toState: "approved_for_execution",
          actorId: "committee-chair",
          actorRole: "committee",
          action: "IDEA_APPROVED_FOR_EXECUTION",
          notes: "Approved after complete judging",
          pmName: "PMO Office",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر اعتماد الفكرة")

      setMessage("تم اعتماد الفكرة للتنفيذ")
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
        <p className="mt-2 text-sm text-slate-300">تحكيم أولي آلي + تحكيم بشري بمعايير موحدة + سجل تقييمات + متوسط نهائي + اعتماد للتنفيذ.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
            <p className="text-xs text-slate-400">إجمالي الأفكار</p>
            <p className="mt-1 text-2xl font-semibold text-slate-100">{dashboard.total}</p>
          </div>
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-3">
            <p className="text-xs text-violet-200">قيد التحكيم</p>
            <p className="mt-1 text-2xl font-semibold text-violet-100">{dashboard.underJudging}</p>
          </div>
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3">
            <p className="text-xs text-sky-200">مكتمل التحكيم</p>
            <p className="mt-1 text-2xl font-semibold text-sky-100">{dashboard.completed}</p>
          </div>
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3">
            <p className="text-xs text-rose-200">أفكار متأخرة</p>
            <p className="mt-1 text-2xl font-semibold text-rose-100">{dashboard.delayed}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-200">متوسط زمن التحكيم</p>
            <p className="mt-1 text-2xl font-semibold text-amber-100">{dashboard.avgCycleDays} يوم</p>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}
      {message && <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-emerald-200">{message}</div>}
      {!canJudge && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          وضع القراءة فقط: إجراءات التحكيم متاحة لدور اللجنة أو الإدارة.
        </div>
      )}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-100">قائمة الأفكار للتحكيم</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-100"
            >
              <option value="all">كل الحالات</option>
              <option value="prototype_ready">جاهز للآلي</option>
              <option value="ai_judged">جاهز للبشري</option>
              <option value="human_judged">مكتمل</option>
              <option value="approved_for_execution">معتمد للتنفيذ</option>
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-100"
            >
              <option value="all">كل الإدارات</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-300">جارٍ التحميل...</p>
        ) : filteredIdeas.length === 0 ? (
          <p className="text-slate-300">لا توجد أفكار مطابقة للفلترة الحالية.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs text-slate-400">
                  <th className="px-3 py-2">الفكرة</th>
                  <th className="px-3 py-2">الحالة</th>
                  <th className="px-3 py-2">الأولوية</th>
                  <th className="px-3 py-2">الإدارة</th>
                  <th className="px-3 py-2">زمن التحكيم</th>
                </tr>
              </thead>
              <tbody>
                {filteredIdeas.map((idea) => {
                  const active = idea.id === selectedIdeaId
                  const badgeClass = stateTone[idea.state] || "border-slate-500/30 bg-slate-500/10 text-slate-200"
                  return (
                    <tr
                      key={idea.id}
                      onClick={() => setSelectedIdeaId(idea.id)}
                      className={`cursor-pointer border-b border-slate-800 transition ${active ? "bg-slate-800/60" : "hover:bg-slate-800/30"}`}
                    >
                      <td className="px-3 py-3 text-slate-100">{idea.title}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full border px-2 py-1 text-[11px] ${badgeClass}`}>
                          {stateBadge[idea.state] || idea.state}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-200">{ideaPriority(idea)}</td>
                      <td className="px-3 py-3 text-slate-300">{ideaDepartment(idea)}</td>
                      <td className="px-3 py-3 text-slate-300">{daysSince(idea.created_at)} يوم</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedIdea && summary && (
        <>
          <section className="rounded-3xl border border-violet-500/30 bg-violet-500/10 p-6">
            <h2 className="text-xl font-semibold text-violet-100">التحكيم الآلي: كيف يعمل؟</h2>
            <p className="mt-2 text-sm text-violet-200">النظام يقرأ وصف الفكرة ويقيّم كل معيار من 0-100، ثم يحسب الدرجة المرجحة باستخدام وزن كل معيار.</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-violet-400/30 bg-violet-950/30 p-4">
                <p className="text-sm font-semibold text-violet-100">المعادلة</p>
                <p className="mt-2 text-xs text-violet-200">النتيجة = مجموع (درجة المعيار × وزنه) ÷ مجموع الأوزان</p>
                <p className="mt-2 text-xs text-violet-200">الدرجة الآلية الحالية: {selectedIdea.latest_ai_score ?? "غير متاح"}</p>
              </div>
              <div className="rounded-2xl border border-violet-400/30 bg-violet-950/30 p-4">
                <p className="text-sm font-semibold text-violet-100">تنفيذ التحكيم الآلي</p>
                <button
                  onClick={runAutoPreJudging}
                  disabled={saving || !["prototype_ready", "ai_judged"].includes(selectedIdea.state) || !canJudge}
                  className="mt-3 rounded-xl border border-violet-300/40 bg-violet-500/20 px-4 py-2 text-xs text-violet-100 disabled:opacity-50"
                >
                  {saving ? "جارٍ التنفيذ..." : "تشغيل التحكيم الآلي الآن"}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {summary.criteria.map((criterion) => (
                <div key={criterion.id} className="rounded-2xl border border-violet-400/20 bg-slate-900/40 p-3">
                  <p className="text-sm text-slate-100">{criterion.criterion}</p>
                  <p className="text-xs text-violet-200">الوزن: {criterion.weight}%</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
            <h2 className="text-xl font-semibold text-slate-100">واجهة التحكيم البشري</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs text-slate-300">اسم المحكّم</span>
                <input
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  disabled={!canJudge}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-300">نوع المحكّم</span>
                <select
                  value={evaluatorRole}
                  onChange={(e) => setEvaluatorRole(e.target.value)}
                  disabled={!canJudge}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
                >
                  <option value="committee">لجنة</option>
                  <option value="clinical">سريري</option>
                  <option value="operational">تشغيلي</option>
                  <option value="technical">تقني</option>
                </select>
              </label>
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
                    disabled={!canJudge}
                    onChange={(e) => setScores((prev) => ({ ...prev, [criterion.id]: Number(e.target.value) }))}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
                  />
                  <textarea
                    value={comments[criterion.id] || ""}
                    disabled={!canJudge}
                    onChange={(e) => setComments((prev) => ({ ...prev, [criterion.id]: e.target.value }))}
                    placeholder="ملاحظات المحكّم على هذا المعيار"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-xs text-slate-100"
                    rows={2}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">الدرجة المرجحة الحالية: {localWeightedScore}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={saving || !canJudge}
                onClick={submitHumanEvaluation}
                className="rounded-2xl bg-sky-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? "جارٍ الحفظ..." : "حفظ التقييم البشري"}
              </button>
              <button
                disabled={saving || selectedIdea.state !== "human_judged" || !canJudge}
                onClick={approveForExecution}
                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                اعتماد للتنفيذ
              </button>
              <button
                onClick={exportFinalReport}
                className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200"
              >
                تصدير التقرير النهائي
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
            <h2 className="text-xl font-semibold text-slate-100">سجل تقييم كل محكّم</h2>
            <div className="mt-4 space-y-2">
              {summary.evaluatorScores.length === 0 ? (
                <p className="text-sm text-slate-400">لا يوجد تقييمات بعد.</p>
              ) : (
                summary.evaluatorScores
                  .slice()
                  .sort((a, b) => b.weightedScore - a.weightedScore)
                  .map((entry, idx) => (
                    <div key={`${entry.evaluator}-${idx}`} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                      <p className="text-sm text-slate-200">{entry.evaluator} ({entry.role}) - {entry.weightedScore}</p>
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
              <p className="mt-2 text-sm text-emerald-200">متوسط التقييم: {summary.finalReport.averageScore} | الدرجة الآلية: {summary.finalReport.preJudgingScore ?? "-"}</p>

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
