"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type Challenge = {
  id: string
  title: string
  description: string | null
  department: string | null
  success_criteria: string | null
  impact_metric: string | null
  status: string
  created_at: string
}

type Idea = {
  id: string
  challenge_id: string | null
}

const statusLabels: Record<string, string> = {
  open: "مفتوح",
  in_review: "قيد المراجعة",
  closed: "مغلق",
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [department, setDepartment] = useState("")
  const [successCriteria, setSuccessCriteria] = useState("")
  const [impactMetric, setImpactMetric] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const statusQuery = statusFilter !== "all" ? `?status=${statusFilter}` : ""
      const [chRes, ideasRes] = await Promise.all([fetch(`/api/challenges${statusQuery}`), fetch("/api/ideas")])
      const chJson = await chRes.json()
      const ideasJson = await ideasRes.json()

      if (!chRes.ok) throw new Error(chJson.error || "تعذر تحميل التحديات")
      if (!ideasRes.ok) throw new Error(ideasJson.error || "تعذر تحميل الأفكار")

      setChallenges(chJson.data || [])
      setIdeas(ideasJson.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
    }, 30000)
    return () => clearInterval(timer)
  }, [load])

  const ideaCountByChallenge = useMemo(() => {
    const m = new Map<string, number>()
    ideas.forEach((idea) => {
      if (!idea.challenge_id) return
      m.set(idea.challenge_id, (m.get(idea.challenge_id) || 0) + 1)
    })
    return m
  }, [ideas])

  const filteredChallenges = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return challenges

    return challenges.filter((item) => {
      const titleText = item.title.toLowerCase()
      const dept = (item.department || "").toLowerCase()
      const desc = (item.description || "").toLowerCase()
      return titleText.includes(value) || dept.includes(value) || desc.includes(value)
    })
  }, [challenges, query])

  const summary = useMemo(() => {
    const open = challenges.filter((item) => item.status === "open").length
    const closed = challenges.filter((item) => item.status === "closed").length
    return {
      total: challenges.length,
      open,
      closed,
      linkedIdeas: ideas.filter((i) => i.challenge_id).length,
    }
  }, [challenges, ideas])

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
          actorId: "employee",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء التحدي")

      setTitle("")
      setDescription("")
      setDepartment("")
      setSuccessCriteria("")
      setImpactMetric("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const updateChallengeStatus = async (item: Challenge, status: "open" | "closed") => {
    try {
      const res = await fetch("/api/challenges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status,
          actorId: "management",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحديث حالة التحدي")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">إدارة التحديات</h1>
        <p className="mt-2 text-sm text-slate-300">
          بوابة التحديات مربوطة مباشرة برحلة state machine للأفكار من الطرح حتى التنفيذ.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">إجمالي التحديات</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">التحديات المفتوحة</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.open}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">التحديات المغلقة</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{summary.closed}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">أفكار مرتبطة</p>
          <p className="mt-1 text-2xl font-semibold text-sky-300">{summary.linkedIdeas}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="text-xl font-semibold text-slate-100">طرح تحدي جديد</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان التحدي"
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="الإدارة المعنية"
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف التحدي"
            className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
          <input
            value={successCriteria}
            onChange={(e) => setSuccessCriteria(e.target.value)}
            placeholder="معايير النجاح"
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
          <input
            value={impactMetric}
            onChange={(e) => setImpactMetric(e.target.value)}
            placeholder="مؤشر الأثر"
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
        </div>

        <button
          onClick={createChallenge}
          disabled={saving}
          className="mt-4 rounded-2xl bg-sky-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : "إنشاء التحدي"}
        </button>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-100">التحديات الحالية</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالعنوان/الوصف/الإدارة"
            className="min-w-56 flex-1 rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
          >
            <option value="all">كل الحالات</option>
            <option value="open">مفتوح</option>
            <option value="closed">مغلق</option>
          </select>
        </div>

        {loading ? (
          <p className="text-slate-300">جارٍ التحميل...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredChallenges.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-300">
                    {ideaCountByChallenge.get(item.id) || 0} فكرة
                  </span>
                </div>

                <p className="text-sm text-slate-300">{item.description || "بدون وصف"}</p>
                <p className="mt-2 text-xs text-slate-400">الإدارة: {item.department || "غير محدد"}</p>
                <p className="mt-1 text-xs text-slate-400">معيار النجاح: {item.success_criteria || "غير محدد"}</p>
                <p className="mt-1 text-xs text-slate-400">مؤشر الأثر: {item.impact_metric || "غير محدد"}</p>
                <p className="mt-1 text-xs text-slate-400">الحالة: {statusLabels[item.status] || item.status}</p>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => updateChallengeStatus(item, "open")}
                    disabled={item.status === "open"}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200 disabled:opacity-50"
                  >
                    فتح
                  </button>
                  <button
                    onClick={() => updateChallengeStatus(item, "closed")}
                    disabled={item.status === "closed"}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs text-amber-200 disabled:opacity-50"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
