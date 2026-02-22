"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type Lifecycle = "draft" | "open" | "in_review" | "closed" | "archived"

type Challenge = {
  id: string
  title: string
  description: string | null
  department: string | null
  success_criteria: string | null
  impact_metric: string | null
  lifecycle_status: Lifecycle
  target_ideas: number
  start_date: string | null
  end_date: string | null
  metrics: {
    ideasCount: number
    acceptedIdeas: number
    projectsCount: number
    progressRate: number
    avgProjectProgress: number
    needsExtension: boolean
  }
  effectiveness: {
    score: number
    level: "effective" | "average" | "weak"
    recommendation: string
  }
}

type Dashboard = {
  mostParticipatingDepartments: Array<{ department: string; ideas: number; challenges: number }>
  mostAttractiveChallenges: Array<{ id: string; title: string; department: string | null; ideasCount: number }>
  needsExtension: Array<{ id: string; title: string; endDate: string | null; acceptedIdeas: number; targetIdeas: number }>
  noIdeas: Array<{ id: string; title: string; department: string | null }>
  effectivenessSummary: { effective: number; average: number; weak: number }
}

const lifecycleLabels: Record<Lifecycle, string> = {
  draft: "Draft",
  open: "Open",
  in_review: "In Review",
  closed: "Closed",
  archived: "Archived",
}

const levelClass: Record<string, string> = {
  effective: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  average: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  weak: "text-red-300 border-red-500/30 bg-red-500/10",
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [lifecycleFilter, setLifecycleFilter] = useState<"all" | Lifecycle>("all")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [department, setDepartment] = useState("")
  const [successCriteria, setSuccessCriteria] = useState("")
  const [impactMetric, setImpactMetric] = useState("")
  const [targetIdeas, setTargetIdeas] = useState(5)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [lifecycleStatus, setLifecycleStatus] = useState<Lifecycle>("draft")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (lifecycleFilter !== "all") params.set("lifecycle", lifecycleFilter)

      const res = await fetch(`/api/challenges?${params.toString()}`)
      const json = await res.json()

      if (!res.ok) throw new Error(json.error || "تعذر تحميل التحديات")

      setChallenges(json.data || [])
      setDashboard(json.dashboard || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }, [lifecycleFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
    }, 30000)
    return () => clearInterval(timer)
  }, [load])

  const filteredChallenges = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return challenges

    return challenges.filter((item) => {
      const text = [item.title, item.department || "", item.description || ""].join(" ").toLowerCase()
      return text.includes(value)
    })
  }, [challenges, query])

  const summary = useMemo(() => {
    return {
      total: challenges.length,
      open: challenges.filter((c) => c.lifecycle_status === "open").length,
      inReview: challenges.filter((c) => c.lifecycle_status === "in_review").length,
      needsExtension: challenges.filter((c) => c.metrics.needsExtension).length,
    }
  }, [challenges])

  const createChallenge = async () => {
    if (!title.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          department,
          successCriteria,
          impactMetric,
          lifecycleStatus,
          targetIdeas,
          startDate: startDate || null,
          endDate: endDate || null,
          actorId: "innovation-office",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء التحدي")

      setTitle("")
      setDescription("")
      setDepartment("")
      setSuccessCriteria("")
      setImpactMetric("")
      setTargetIdeas(5)
      setStartDate("")
      setEndDate("")
      setLifecycleStatus("draft")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const updateLifecycle = async (challenge: Challenge, next: Lifecycle) => {
    try {
      const res = await fetch("/api/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: challenge.id,
          lifecycleStatus: next,
          actorId: "innovation-manager",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحديث الحالة")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">إدارة التحديات - مستوى احترافي</h1>
        <p className="mt-2 text-sm text-slate-300">
          دورة حياة كاملة + مؤشرات لكل تحدي + تقييم فعالية + Challenge Dashboard تحليلي.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">إجمالي التحديات</p><p className="mt-1 text-2xl font-semibold text-slate-100">{summary.total}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">Open</p><p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.open}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">In Review</p><p className="mt-1 text-2xl font-semibold text-violet-300">{summary.inReview}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">تحتاج تمديد</p><p className="mt-1 text-2xl font-semibold text-amber-300">{summary.needsExtension}</p></div>
      </section>

      {dashboard && (
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/20 bg-slate-900/55 p-5">
            <h2 className="text-lg font-semibold text-slate-100">Challenge Dashboard</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                <p className="font-semibold text-slate-100">أكثر الإدارات مشاركة</p>
                {dashboard.mostParticipatingDepartments.map((d) => (
                  <p key={d.department} className="mt-1">{d.department}: {d.ideas} أفكار</p>
                ))}
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                <p className="font-semibold text-slate-100">أكثر التحديات جذبًا</p>
                {dashboard.mostAttractiveChallenges.map((c) => (
                  <p key={c.id} className="mt-1">{c.title}: {c.ideasCount} أفكار</p>
                ))}
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                <p className="font-semibold text-slate-100">تحديات تحتاج تمديد</p>
                {dashboard.needsExtension.length === 0 ? <p className="mt-1">لا يوجد</p> : dashboard.needsExtension.map((c) => (
                  <p key={c.id} className="mt-1">{c.title} ({c.acceptedIdeas}/{c.targetIdeas})</p>
                ))}
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                <p className="font-semibold text-slate-100">تحديات بلا أفكار</p>
                {dashboard.noIdeas.length === 0 ? <p className="mt-1">لا يوجد</p> : dashboard.noIdeas.map((c) => (
                  <p key={c.id} className="mt-1">{c.title}</p>
                ))}
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
              <p>فعّالة: {dashboard.effectivenessSummary.effective}</p>
              <p>متوسطة: {dashboard.effectivenessSummary.average}</p>
              <p>ضعيفة: {dashboard.effectivenessSummary.weak}</p>
            </div>
          </div>

          <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
            <h2 className="text-xl font-semibold text-slate-100">طرح تحدي جديد</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان التحدي" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
              <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="الإدارة المعنية" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف التحدي" className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
              <input value={successCriteria} onChange={(e) => setSuccessCriteria(e.target.value)} placeholder="معايير النجاح" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
              <input value={impactMetric} onChange={(e) => setImpactMetric(e.target.value)} placeholder="مؤشر الأثر" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
              <input type="number" min={1} value={targetIdeas} onChange={(e) => setTargetIdeas(Number(e.target.value || 1))} placeholder="الهدف من الأفكار" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
              <select value={lifecycleStatus} onChange={(e) => setLifecycleStatus(e.target.value as Lifecycle)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
                {Object.entries(lifecycleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
            </div>

            <button onClick={createChallenge} disabled={saving} className="mt-4 rounded-2xl bg-sky-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
              {saving ? "جارٍ الحفظ..." : "إنشاء التحدي"}
            </button>
          </section>
        </section>
      )}

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <div className="mb-4 grid gap-2 md:grid-cols-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث في التحديات" className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100" />
          <select value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value as "all" | Lifecycle)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100">
            <option value="all">كل الحالات</option>
            {Object.entries(lifecycleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-slate-300">جارٍ التحميل...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredChallenges.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-300">
                    {lifecycleLabels[item.lifecycle_status]}
                  </span>
                </div>

                <p className="text-sm text-slate-300">{item.description || "بدون وصف"}</p>
                <p className="mt-2 text-xs text-slate-400">الإدارة: {item.department || "غير محدد"}</p>
                <p className="mt-1 text-xs text-slate-400">المدة: {item.start_date || "-"} إلى {item.end_date || "-"}</p>
                <p className="mt-1 text-xs text-slate-400">الهدف من الأفكار: {item.target_ideas}</p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2 text-slate-300">الأفكار: {item.metrics.ideasCount}</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2 text-slate-300">المقبولة: {item.metrics.acceptedIdeas}</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2 text-slate-300">المشاريع: {item.metrics.projectsCount}</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2 text-slate-300">التقدم: {item.metrics.progressRate}%</div>
                </div>

                <div className={`mt-3 rounded-lg border p-2 text-xs ${levelClass[item.effectiveness.level] || levelClass.average}`}>
                  التقييم: {item.effectiveness.level} ({item.effectiveness.score}/100)
                  <p className="mt-1">{item.effectiveness.recommendation}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(["draft", "open", "in_review", "closed", "archived"] as Lifecycle[]).map((state) => (
                    <button
                      key={state}
                      onClick={() => updateLifecycle(item, state)}
                      disabled={item.lifecycle_status === state}
                      className="rounded-xl border border-slate-600 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200 disabled:opacity-40"
                    >
                      {lifecycleLabels[state]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
