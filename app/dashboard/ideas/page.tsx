"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getNextSuggestedState, stateTransitions } from "@/lib/workflow/stateMachine"

type ChallengeRef = {
  id: string
  title?: string
  department?: string | null
}

type Idea = {
  id: string
  title: string
  description: string | null
  challenge_id: string | null
  state: string
  maturity_level?: string | null
  expected_impact?: string | null
  idea_quality_score?: number | null
  final_judging_score?: number | null
  created_at: string
  challenges?: ChallengeRef | ChallengeRef[] | null
}

type Challenge = {
  id: string
  title: string
  department?: string | null
}

type IdeaDetail = {
  idea: Idea
  stateEvents: Array<{
    id: string
    from_state: string | null
    to_state: string
    action: string | null
    notes: string | null
    actor_id: string | null
    actor_role: string | null
    created_at: string
  }>
  stageDurations: Array<{ stage: string; days: number }>
  judgingNotes: Array<{ evaluator: string; role: string; comment: string; score: number; at: string }>
  linkedTasks: Array<{ id: string; title: string; status: string; due_date: string | null; priority?: string | null; progress?: number | null; owner_name?: string | null }>
  attachments: Array<{ id: string; file_name: string; file_type: string | null; file_size: number | null; uploaded_at: string }>
  expectedImpact: string | null
  reevaluationCount: number
  successPrediction: number
}

type IdeaInsights = {
  analysis: string
  riskAlerts: string[]
  improvements: string[]
  ideaQualityScore: number
  similarIdeas: Array<{ id: string; title: string; similarity: number }>
}

const stateLabels: Record<string, string> = {
  idea_submitted: "مقدمة",
  ai_refined: "مراجعة AI",
  team_formed: "مراجعة AI",
  prototype_ready: "مراجعة AI",
  ai_judged: "مراجعة AI",
  human_judged: "مراجعة بشرية",
  approved_for_execution: "مقبولة",
  execution_in_progress: "تنفيذ",
  impact_tracking: "تنفيذ",
  protected_published: "مكتملة",
  rejected: "مرفوضة",
}

const maturityLabels: Record<string, string> = {
  idea: "Idea",
  concept: "Concept",
  prototype: "Prototype",
}

const journey = [
  { key: "submitted", label: "Submitted" },
  { key: "ai_review", label: "AI Review" },
  { key: "human_review", label: "Human Review" },
  { key: "accepted", label: "Accepted" },
  { key: "execution", label: "Execution" },
  { key: "completed", label: "Completed" },
]

function journeyIndex(state: string) {
  if (state === "idea_submitted") return 0
  if (["ai_refined", "team_formed", "prototype_ready", "ai_judged"].includes(state)) return 1
  if (state === "human_judged") return 2
  if (state === "approved_for_execution") return 3
  if (["execution_in_progress", "impact_tracking"].includes(state)) return 4
  if (state === "protected_published") return 5
  return 0
}

function normalizedChallenge(challenges: Idea["challenges"]) {
  if (!challenges) return null
  return Array.isArray(challenges) ? challenges[0] || null : challenges
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [assistantLoading, setAssistantLoading] = useState<string | null>(null)
  const [assistantOutput, setAssistantOutput] = useState<Record<string, string>>({})

  const [query, setQuery] = useState("")
  const [stateFilter, setStateFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [challengeFilter, setChallengeFilter] = useState("all")
  const [maturityFilter, setMaturityFilter] = useState("all")
  const [impactFilter, setImpactFilter] = useState("")

  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [ideaDetail, setIdeaDetail] = useState<IdeaDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [insights, setInsights] = useState<IdeaInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [challengeId, setChallengeId] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [ideasRes, challengesRes] = await Promise.all([
        fetch("/api/ideas"),
        fetch("/api/challenges"),
      ])

      const ideasJson = await ideasRes.json()
      const challengesJson = await challengesRes.json()

      if (!ideasRes.ok) throw new Error(ideasJson.error || "تعذر تحميل الأفكار")
      if (!challengesRes.ok) throw new Error(challengesJson.error || "تعذر تحميل التحديات")

      setIdeas(ideasJson.data || [])
      setChallenges((challengesJson.data || []).map((row: Challenge) => ({ id: row.id, title: row.title, department: row.department || null })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadIdeaDetails = useCallback(async (ideaId: string) => {
    setDetailLoading(true)
    try {
      const [detailsRes, insightsRes] = await Promise.all([
        fetch(`/api/ideas/${ideaId}/details`),
        fetch(`/api/ideas/${ideaId}/insights`),
      ])
      const detailsJson = await detailsRes.json()
      const insightsJson = await insightsRes.json()
      if (!detailsRes.ok) throw new Error(detailsJson.error || "تعذر تحميل تفاصيل الفكرة")
      if (!insightsRes.ok) throw new Error(insightsJson.error || "تعذر تحميل تحليلات الفكرة")

      setIdeaDetail(detailsJson.data)
      setInsights(insightsJson.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setDetailLoading(false)
      setInsightsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
      if (selectedIdeaId) {
        void loadIdeaDetails(selectedIdeaId)
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [load, loadIdeaDetails, selectedIdeaId])

  const departments = useMemo(() => Array.from(new Set(challenges.map((c) => c.department).filter(Boolean) as string[])), [challenges])

  const challengeName = useMemo(() => {
    const map = new Map<string, string>()
    challenges.forEach((c) => map.set(c.id, c.title))
    return map
  }, [challenges])

  const filteredIdeas = useMemo(() => {
    const value = query.trim().toLowerCase()
    const impactText = impactFilter.trim().toLowerCase()

    return ideas.filter((idea) => {
      const ch = normalizedChallenge(idea.challenges)
      const dept = ch?.department || ""

      if (stateFilter !== "all" && idea.state !== stateFilter) return false
      if (departmentFilter !== "all" && dept !== departmentFilter) return false
      if (challengeFilter !== "all" && idea.challenge_id !== challengeFilter) return false
      if (maturityFilter !== "all" && (idea.maturity_level || "idea") !== maturityFilter) return false
      if (impactText && !(idea.expected_impact || "").toLowerCase().includes(impactText)) return false

      if (!value) return true
      const haystack = [
        idea.title,
        idea.description || "",
        ch?.title || "",
        dept,
        idea.expected_impact || "",
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(value)
    })
  }, [ideas, query, stateFilter, departmentFilter, challengeFilter, maturityFilter, impactFilter])

  const summary = useMemo(() => {
    const total = ideas.length
    const execution = ideas.filter((idea) => ["approved_for_execution", "execution_in_progress", "impact_tracking", "protected_published"].includes(idea.state)).length
    const rejected = ideas.filter((idea) => idea.state === "rejected").length
    const avgQuality = ideas.length > 0
      ? Math.round(
          ideas.reduce((sum, idea) => sum + Number(idea.idea_quality_score || 0), 0) / ideas.length
        )
      : 0

    return { total, execution, rejected, avgQuality }
  }, [ideas])

  const createIdea = async () => {
    if (!title.trim()) return
    setSaving(true)

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          challengeId: challengeId || null,
          ownerId: "employee",
          ownerName: "مبتكر",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء الفكرة")

      setTitle("")
      setDescription("")
      setChallengeId("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const transition = async (idea: Idea, toState: string) => {
    try {
      const res = await fetch(`/api/ideas/${idea.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toState,
          actorId: "workflow-admin",
          actorRole: "management",
          action: "IDEA_STATE_UPDATED",
          notes: `Manual transition to ${toState}`,
          pmName: "PMO Team",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Transition failed")

      await load()
      if (selectedIdeaId === idea.id) {
        await loadIdeaDetails(idea.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  const askAssistant = async (idea: Idea) => {
    setAssistantLoading(idea.id)
    try {
      const step = idea.state
      const prompt = `الفكرة: ${idea.title}\nالوصف: ${idea.description || "لا يوجد"}\nالمرحلة الحالية: ${step}\nقدم توصيات فورية للفريق.`
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, step, prompt }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "AI assist failed")

      const payload = json.data || {}
      const text = [
        `ملخص: ${payload.summary || "-"}`,
        `تحسينات: ${(payload.improvements || []).join(" | ")}`,
        `المخاطر: ${(payload.riskAlerts || []).join(" | ")}`,
        `Idea Quality Score: ${payload.ideaQualityScore || idea.idea_quality_score || "-"}`,
      ].join("\n")

      setAssistantOutput((prev) => ({ ...prev, [idea.id]: text }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setAssistantLoading(null)
    }
  }

  const openDetail = async (ideaId: string) => {
    setSelectedIdeaId(ideaId)
    setInsightsLoading(true)
    await loadIdeaDetails(ideaId)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">إدارة الأفكار الاحترافية</h1>
        <p className="mt-2 text-sm text-slate-300">
          مسار الفكرة بصريًا + Drill‑Down شامل + ذكاء تحليلي + فلترة متقدمة + مؤشرات أداء لكل فكرة.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">إجمالي الأفكار</p><p className="mt-1 text-2xl font-semibold text-slate-100">{summary.total}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">في التنفيذ/الأثر</p><p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.execution}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">مرفوضة</p><p className="mt-1 text-2xl font-semibold text-amber-300">{summary.rejected}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">متوسط جودة الفكرة</p><p className="mt-1 text-2xl font-semibold text-sky-300">{summary.avgQuality}</p></div>
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="text-xl font-semibold text-slate-100">إضافة فكرة سريعة</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الفكرة" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
          <select value={challengeId} onChange={(e) => setChallengeId(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
            <option value="">بدون ربط تحدي</option>
            {challenges.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر" className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
        </div>
        <button onClick={createIdea} disabled={saving} className="mt-4 rounded-2xl bg-sky-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "جارٍ الإنشاء..." : "إنشاء فكرة"}
        </button>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-4">
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث" className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100" />
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">المرحلة</option>{Object.entries(stateLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">الإدارة</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select>
          <select value={challengeFilter} onChange={(e) => setChallengeFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">التحدي</option>{challenges.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
          <select value={maturityFilter} onChange={(e) => setMaturityFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">مستوى النضج</option>{Object.entries(maturityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input value={impactFilter} onChange={(e) => setImpactFilter(e.target.value)} placeholder="الأثر المتوقع" className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100" />
        </div>
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">الأفكار الحالية</h2>

        {loading ? (
          <p className="text-slate-300">جارٍ التحميل...</p>
        ) : (
          <div className="space-y-3">
            {filteredIdeas.map((idea) => {
              const suggested = getNextSuggestedState(idea.state)
              const transitions = stateTransitions[idea.state as keyof typeof stateTransitions] || []
              const currentStep = journeyIndex(idea.state)
              const challenge = normalizedChallenge(idea.challenges)

              return (
                <div key={idea.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-100">{idea.title}</h3>
                    <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-300">
                      {stateLabels[idea.state] || idea.state}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-300">{idea.description || "بدون وصف"}</p>
                  <p className="mt-1 text-xs text-slate-400">التحدي: {challenge?.title || (idea.challenge_id ? challengeName.get(idea.challenge_id) : "غير مرتبط") || "غير معروف"}</p>
                  <p className="mt-1 text-xs text-slate-400">الإدارة: {challenge?.department || "غير محددة"}</p>
                  <p className="mt-1 text-xs text-slate-400">النضج: {maturityLabels[idea.maturity_level || "idea"] || "Idea"} | الجودة: {idea.idea_quality_score ?? "-"}</p>

                  <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                    <p className="mb-2 text-xs text-slate-400">Idea Journey Map</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {journey.map((step, idx) => (
                        <div key={step.key} className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-[11px] ${idx <= currentStep ? "bg-sky-600 text-white" : "border border-slate-600 text-slate-300"}`}>
                            {step.label}
                          </span>
                          {idx < journey.length - 1 && <span className="text-slate-500">←</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {transitions.map((next) => (
                      <button
                        key={next}
                        onClick={() => transition(idea, next)}
                        className={`rounded-xl px-3 py-1.5 text-xs ${
                          suggested === next
                            ? "bg-sky-600 text-white"
                            : "border border-slate-600 bg-slate-900/80 text-slate-200"
                        }`}
                      >
                        انتقال إلى: {stateLabels[next] || next}
                      </button>
                    ))}
                    <button onClick={() => askAssistant(idea)} className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs text-violet-200">
                      {assistantLoading === idea.id ? "AI..." : "تحليل AI"}
                    </button>
                    <button onClick={() => void openDetail(idea.id)} className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs text-cyan-200">
                      التفاصيل الكاملة
                    </button>
                  </div>

                  {assistantOutput[idea.id] && (
                    <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-100">
                      {assistantOutput[idea.id]}
                    </pre>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {selectedIdeaId && (
        <section className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-cyan-100">Drill‑Down تفاصيل الفكرة</h2>
            <button onClick={() => { setSelectedIdeaId(null); setIdeaDetail(null); setInsights(null) }} className="rounded-xl border border-cyan-300/40 px-3 py-1 text-xs text-cyan-100">إغلاق</button>
          </div>

          {detailLoading || insightsLoading ? (
            <p className="text-cyan-100">جارٍ تحميل التفاصيل...</p>
          ) : ideaDetail ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3 text-cyan-100">احتمالية النجاح (AI): {ideaDetail.successPrediction}%</div>
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3 text-cyan-100">إعادة التقييم: {ideaDetail.reevaluationCount}</div>
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3 text-cyan-100">الأثر المتوقع: {ideaDetail.expectedImpact || "غير محدد"}</div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3">
                  <h3 className="font-semibold text-cyan-100">الانتقالات (State Events)</h3>
                  <ul className="mt-2 space-y-2 text-xs text-cyan-100">
                    {ideaDetail.stateEvents.map((ev) => (
                      <li key={ev.id} className="rounded-lg bg-cyan-950/30 px-2 py-1.5">
                        {ev.from_state || "بداية"} ← {ev.to_state} | بواسطة: {ev.actor_id || "-"} ({ev.actor_role || "-"})
                        <p className="mt-1 text-cyan-200">{ev.notes || "-"}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3">
                  <h3 className="font-semibold text-cyan-100">زمن كل مرحلة</h3>
                  <ul className="mt-2 space-y-2 text-xs text-cyan-100">
                    {ideaDetail.stageDurations.map((row, idx) => (
                      <li key={`${row.stage}-${idx}`} className="rounded-lg bg-cyan-950/30 px-2 py-1.5">{stateLabels[row.stage] || row.stage}: {row.days} يوم</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3">
                  <h3 className="font-semibold text-cyan-100">ملاحظات المحكمين</h3>
                  <ul className="mt-2 space-y-2 text-xs text-cyan-100">
                    {ideaDetail.judgingNotes.length === 0 ? <li>لا توجد ملاحظات بعد.</li> : ideaDetail.judgingNotes.map((n, idx) => (
                      <li key={`${n.evaluator}-${idx}`} className="rounded-lg bg-cyan-950/30 px-2 py-1.5">{n.evaluator} ({n.role}) - {n.comment}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3">
                  <h3 className="font-semibold text-cyan-100">المهام المرتبطة</h3>
                  <ul className="mt-2 space-y-2 text-xs text-cyan-100">
                    {ideaDetail.linkedTasks.length === 0 ? <li>لا توجد مهام مرتبطة.</li> : ideaDetail.linkedTasks.map((t) => (
                      <li key={t.id} className="rounded-lg bg-cyan-950/30 px-2 py-1.5">{t.title} - {t.status} - {t.progress ?? 0}%</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3">
                  <h3 className="font-semibold text-cyan-100">الملفات</h3>
                  <ul className="mt-2 space-y-2 text-xs text-cyan-100">
                    {ideaDetail.attachments.length === 0 ? <li>لا توجد ملفات.</li> : ideaDetail.attachments.map((f) => (
                      <li key={f.id} className="rounded-lg bg-cyan-950/30 px-2 py-1.5">{f.file_name} ({f.file_type || "file"})</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3">
                  <h3 className="font-semibold text-cyan-100">تحليلات AI</h3>
                  {insights ? (
                    <div className="mt-2 space-y-2 text-xs text-cyan-100">
                      <p className="rounded-lg bg-cyan-950/30 px-2 py-1.5">{insights.analysis}</p>
                      <p className="rounded-lg bg-cyan-950/30 px-2 py-1.5">Idea Quality Score: {insights.ideaQualityScore}</p>
                      <p className="font-semibold">المخاطر:</p>
                      {insights.riskAlerts.map((r, idx) => <p key={`r-${idx}`} className="rounded-lg bg-cyan-950/30 px-2 py-1.5">{r}</p>)}
                      <p className="font-semibold">التحسينات:</p>
                      {insights.improvements.map((r, idx) => <p key={`i-${idx}`} className="rounded-lg bg-cyan-950/30 px-2 py-1.5">{r}</p>)}
                      <p className="font-semibold">أفكار مشابهة:</p>
                      {insights.similarIdeas.map((s) => <p key={s.id} className="rounded-lg bg-cyan-950/30 px-2 py-1.5">{s.title} ({s.similarity}%)</p>)}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-cyan-100">لا توجد بيانات AI.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-cyan-100">لا توجد تفاصيل.</p>
          )}
        </section>
      )}
    </div>
  )
}
