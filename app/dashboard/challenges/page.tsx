"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useDemoRole } from "@/lib/auth/useDemoRole"

type Lifecycle = "draft" | "open" | "in_review" | "closed" | "archived"

type Challenge = {
  id: string
  title: string
  description: string | null
  department: string | null
  innovation_track: string | null
  challenge_owner: string | null
  baseline_value: string | null
  target_value: string | null
  scope_in: string | null
  scope_out: string | null
  execution_constraints: string | null
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

type ChallengeTemplate = {
  title: string
  innovationTrack: string
  department: string
  challengeOwner: string
  description: string
  baselineValue: string
  targetValue: string
  impactMetric: string
  successCriteria: string
  scopeIn: string
  scopeOut: string
  executionConstraints: string
  targetIdeas: number
}

const lifecycleLabels: Record<Lifecycle, string> = {
  draft: "Draft",
  open: "Open",
  in_review: "In Review",
  closed: "Closed",
  archived: "Archived",
}

const innovationTracks = ["سريري", "تشغيلي", "رقمي", "تجربة المريض", "وقائي/مدرسي"]

const realChallengeTemplates: ChallengeTemplate[] = [
  {
    title: "تقليل زمن انتظار العيادات الخارجية",
    innovationTrack: "سريري",
    department: "العيادات الخارجية",
    challengeOwner: "مدير الخدمات العلاجية",
    description: "ارتفاع زمن الانتظار يؤثر على رضا المرضى وكفاءة التشغيل. نحتاج حلًا عمليًا يقلل الانتظار دون زيادة الكادر.",
    baselineValue: "متوسط الانتظار الحالي 62 دقيقة",
    targetValue: "خفض المتوسط إلى 35 دقيقة خلال 90 يوم",
    impactMetric: "متوسط زمن الانتظار + رضا المرضى",
    successCriteria: "انخفاض الانتظار 40% واستدامة التحسن 8 أسابيع",
    scopeIn: "الفرز، جدولة العيادات، توزيع الكوادر، إدارة التدفق",
    scopeOut: "توسعة مباني أو زيادة مراكز جديدة",
    executionConstraints: "لا زيادة وظيفية دائمة، التوافق مع نظام المواعيد الحالي",
    targetIdeas: 8,
  },
  {
    title: "خفض نسبة عدم حضور المواعيد",
    innovationTrack: "تشغيلي",
    department: "إدارة المواعيد",
    challengeOwner: "مدير التشغيل",
    description: "نسبة عدم الحضور المرتفعة تسبب هدرًا في السعات السريرية وتؤخر المستفيدين.",
    baselineValue: "No-show rate = 24%",
    targetValue: "خفضها إلى 15% خلال 3 أشهر",
    impactMetric: "No-show rate + استغلال السعات",
    successCriteria: "تحسن مستقر 3 دورات شهرية متتالية",
    scopeIn: "تذكيرات ذكية، تأكيد/إلغاء مبكر، إعادة جدولة تلقائية",
    scopeOut: "تغيير سياسات الحجز الوطنية",
    executionConstraints: "تكامل عبر قنوات الرسائل الرسمية",
    targetIdeas: 7,
  },
  {
    title: "تحسين زمن صرف الدواء من الصيدلية",
    innovationTrack: "تجربة المريض",
    department: "الصيدلية",
    challengeOwner: "مدير الخدمات الصيدلانية",
    description: "تأخر صرف الدواء بعد انتهاء الزيارة يضعف التجربة الكلية للمريض.",
    baselineValue: "زمن الصرف المتوسط 28 دقيقة",
    targetValue: "خفضه إلى 15 دقيقة",
    impactMetric: "Turnaround time + رضا المرضى",
    successCriteria: "تحقيق الهدف في 80% من الزيارات",
    scopeIn: "ترتيب الوصفات، أولوية الحالات، إشعارات جاهزية",
    scopeOut: "تعديل منظومة التوريد المركزية",
    executionConstraints: "الالتزام بإجراءات السلامة الدوائية",
    targetIdeas: 6,
  },
  {
    title: "تسريع إغلاق البلاغات التشغيلية الحرجة",
    innovationTrack: "تشغيلي",
    department: "الصيانة والتشغيل",
    challengeOwner: "مدير المرافق",
    description: "البلاغات الحرجة تتأخر بسبب غياب أولوية موحدة وتتبع غير لحظي.",
    baselineValue: "زمن الإغلاق المتوسط 72 ساعة",
    targetValue: "خفضه إلى 24 ساعة",
    impactMetric: "MTTR للبلاغات الحرجة",
    successCriteria: "خفض MTTR 60% مع التزام SLA",
    scopeIn: "التصنيف، التصعيد، التنبيه، لوحات المتابعة",
    scopeOut: "مشاريع بنية تحتية رأسمالية",
    executionConstraints: "ربط مع نظام البلاغات الحالي",
    targetIdeas: 5,
  },
  {
    title: "رفع اكتمال التوثيق السريري",
    innovationTrack: "رقمي",
    department: "السجلات الطبية",
    challengeOwner: "مدير الجودة السريرية",
    description: "نقص التوثيق يؤثر على الجودة والسلامة والاستمرارية العلاجية.",
    baselineValue: "اكتمال التوثيق 71%",
    targetValue: "الوصول إلى 92%",
    impactMetric: "Clinical documentation completeness",
    successCriteria: "تحسن مستدام عبر 2 تدقيقات شهرية",
    scopeIn: "تنبيهات ذكية، قوالب توثيق، متابعة الامتثال",
    scopeOut: "تغيير النظام الوطني للسجل الصحي",
    executionConstraints: "تقليل أي عبء إضافي على الممارس",
    targetIdeas: 7,
  },
]

const levelClass: Record<string, string> = {
  effective: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  average: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  weak: "text-red-300 border-red-500/30 bg-red-500/10",
}

export default function ChallengesPage() {
  const { capabilities } = useDemoRole()
  const canManageChallenges = capabilities.canManageChallenges
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [lifecycleFilter, setLifecycleFilter] = useState<"all" | Lifecycle>("all")
  const [trackFilter, setTrackFilter] = useState<"all" | string>("all")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [department, setDepartment] = useState("")
  const [innovationTrack, setInnovationTrack] = useState(innovationTracks[0])
  const [challengeOwner, setChallengeOwner] = useState("")
  const [baselineValue, setBaselineValue] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [scopeIn, setScopeIn] = useState("")
  const [scopeOut, setScopeOut] = useState("")
  const [executionConstraints, setExecutionConstraints] = useState("")
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
      if (trackFilter !== "all") params.set("track", trackFilter)

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
  }, [lifecycleFilter, trackFilter])

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
      const text = [
        item.title,
        item.department || "",
        item.description || "",
        item.innovation_track || "",
        item.challenge_owner || "",
      ]
        .join(" ")
        .toLowerCase()
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

  const trackStats = useMemo(() => {
    return innovationTracks.map((track) => ({
      track,
      count: challenges.filter((item) => item.innovation_track === track).length,
    }))
  }, [challenges])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setDepartment("")
    setInnovationTrack(innovationTracks[0])
    setChallengeOwner("")
    setBaselineValue("")
    setTargetValue("")
    setScopeIn("")
    setScopeOut("")
    setExecutionConstraints("")
    setSuccessCriteria("")
    setImpactMetric("")
    setTargetIdeas(5)
    setStartDate("")
    setEndDate("")
    setLifecycleStatus("draft")
  }

  const fillFromTemplate = (item: ChallengeTemplate) => {
    setTitle(item.title)
    setInnovationTrack(item.innovationTrack)
    setDepartment(item.department)
    setChallengeOwner(item.challengeOwner)
    setDescription(item.description)
    setBaselineValue(item.baselineValue)
    setTargetValue(item.targetValue)
    setImpactMetric(item.impactMetric)
    setSuccessCriteria(item.successCriteria)
    setScopeIn(item.scopeIn)
    setScopeOut(item.scopeOut)
    setExecutionConstraints(item.executionConstraints)
    setTargetIdeas(item.targetIdeas)
    setLifecycleStatus("open")
  }

  const createChallenge = async (preset?: ChallengeTemplate) => {
    if (!canManageChallenges) return
    const source = preset || {
      title,
      innovationTrack,
      department,
      challengeOwner,
      description,
      baselineValue,
      targetValue,
      impactMetric,
      successCriteria,
      scopeIn,
      scopeOut,
      executionConstraints,
      targetIdeas,
    }

    if (!source.title.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: source.title,
          description: source.description,
          department: source.department,
          innovationTrack: source.innovationTrack,
          challengeOwner: source.challengeOwner,
          baselineValue: source.baselineValue,
          targetValue: source.targetValue,
          scopeIn: source.scopeIn,
          scopeOut: source.scopeOut,
          executionConstraints: source.executionConstraints,
          successCriteria: source.successCriteria,
          impactMetric: source.impactMetric,
          lifecycleStatus,
          targetIdeas: source.targetIdeas,
          startDate: startDate || null,
          endDate: endDate || null,
          actorId: "innovation-office",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء التحدي")

      if (!preset) resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const updateLifecycle = async (challenge: Challenge, next: Lifecycle) => {
    if (!canManageChallenges) return
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
        <h1 className="text-3xl font-semibold text-slate-100">إدارة التحديات - محرك الابتكار الحقيقي</h1>
        <p className="mt-2 text-sm text-slate-300">مسارات واضحة + تحديات واقعية بالـ baseline والهدف والقيود لتوجيه المبتكر نحو مشكلة حقيقية قابلة للتنفيذ.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">إجمالي التحديات</p><p className="mt-1 text-2xl font-semibold text-slate-100">{summary.total}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">Open</p><p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.open}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">In Review</p><p className="mt-1 text-2xl font-semibold text-violet-300">{summary.inReview}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">تحتاج تمديد</p><p className="mt-1 text-2xl font-semibold text-amber-300">{summary.needsExtension}</p></div>
      </section>

      <section className="rounded-3xl border border-slate-700 bg-slate-900/55 p-5">
        <h2 className="text-lg font-semibold text-slate-100">المسارات الاستراتيجية</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-5">
          {trackStats.map((item) => (
            <div key={item.track} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
              <p className="font-semibold text-slate-100">{item.track}</p>
              <p className="mt-1">{item.count} تحدي</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-5">
        <h2 className="text-lg font-semibold text-cyan-100">مكتبة تحديات واقعية جاهزة</h2>
        <p className="mt-1 text-xs text-cyan-200">اختر تحديًا حقيقيًا لتعبئة النموذج فورًا أو إنشائه مباشرة.</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {realChallengeTemplates.map((item) => (
            <div key={item.title} className="rounded-2xl border border-cyan-500/30 bg-slate-950/40 p-4">
              <p className="text-sm font-semibold text-slate-100">{item.title}</p>
              <p className="mt-1 text-xs text-slate-300">المسار: {item.innovationTrack} | الإدارة: {item.department}</p>
              <p className="mt-1 text-xs text-slate-400">Baseline: {item.baselineValue}</p>
              <p className="text-xs text-slate-400">Target: {item.targetValue}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => fillFromTemplate(item)} className="rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-1 text-xs text-slate-200">تعبئة النموذج</button>
                <button onClick={() => createChallenge(item)} disabled={saving || !canManageChallenges} className="rounded-xl border border-cyan-400/50 bg-cyan-500/20 px-3 py-1 text-xs text-cyan-100 disabled:opacity-50">إنشاء مباشر</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!canManageChallenges && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          وضع القراءة فقط: إنشاء وتحديث التحديات متاح لدور PMO أو الإدارة.
        </section>
      )}

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
              <input disabled={!canManageChallenges} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان التحدي" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <select disabled={!canManageChallenges} value={innovationTrack} onChange={(e) => setInnovationTrack(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60">
                {innovationTracks.map((track) => <option key={track} value={track}>{track}</option>)}
              </select>
              <input disabled={!canManageChallenges} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="الإدارة المعنية" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <input disabled={!canManageChallenges} value={challengeOwner} onChange={(e) => setChallengeOwner(e.target.value)} placeholder="مالك التحدي / Sponsor" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <textarea disabled={!canManageChallenges} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف المشكلة الحالية" className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <input disabled={!canManageChallenges} value={baselineValue} onChange={(e) => setBaselineValue(e.target.value)} placeholder="Baseline الحالي" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <input disabled={!canManageChallenges} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="Target المستهدف" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <input disabled={!canManageChallenges} value={successCriteria} onChange={(e) => setSuccessCriteria(e.target.value)} placeholder="معايير النجاح" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <input disabled={!canManageChallenges} value={impactMetric} onChange={(e) => setImpactMetric(e.target.value)} placeholder="مؤشر الأثر" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <textarea disabled={!canManageChallenges} value={scopeIn} onChange={(e) => setScopeIn(e.target.value)} placeholder="النطاق داخل التحدي (In Scope)" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <textarea disabled={!canManageChallenges} value={scopeOut} onChange={(e) => setScopeOut(e.target.value)} placeholder="النطاق خارج التحدي (Out of Scope)" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <textarea disabled={!canManageChallenges} value={executionConstraints} onChange={(e) => setExecutionConstraints(e.target.value)} placeholder="قيود التنفيذ (ميزانية/وقت/سياسات)" className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <input disabled={!canManageChallenges} type="number" min={1} value={targetIdeas} onChange={(e) => setTargetIdeas(Number(e.target.value || 1))} placeholder="الهدف من الأفكار" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <select disabled={!canManageChallenges} value={lifecycleStatus} onChange={(e) => setLifecycleStatus(e.target.value as Lifecycle)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60">
                {Object.entries(lifecycleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <input disabled={!canManageChallenges} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
              <input disabled={!canManageChallenges} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100 disabled:opacity-60" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => void createChallenge()} disabled={saving || !canManageChallenges} className="rounded-2xl bg-sky-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
                {saving ? "جارٍ الحفظ..." : "إنشاء التحدي"}
              </button>
              <button onClick={resetForm} disabled={!canManageChallenges} className="rounded-2xl border border-slate-600 bg-slate-900/80 px-5 py-2 text-sm text-slate-200 disabled:opacity-50">إعادة تعيين</button>
            </div>
          </section>
        </section>
      )}

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <div className="mb-4 grid gap-2 md:grid-cols-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث في التحديات" className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100" />
          <select value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value as "all" | Lifecycle)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100">
            <option value="all">كل الحالات</option>
            {Object.entries(lifecycleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100">
            <option value="all">كل المسارات</option>
            {innovationTracks.map((track) => <option key={track} value={track}>{track}</option>)}
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
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-300">{lifecycleLabels[item.lifecycle_status]}</span>
                </div>

                <p className="text-sm text-slate-300">{item.description || "بدون وصف"}</p>
                <p className="mt-2 text-xs text-slate-400">المسار: {item.innovation_track || "غير محدد"}</p>
                <p className="mt-1 text-xs text-slate-400">الإدارة: {item.department || "غير محدد"}</p>
                <p className="mt-1 text-xs text-slate-400">المالك: {item.challenge_owner || "غير محدد"}</p>
                <p className="mt-1 text-xs text-slate-400">Baseline: {item.baseline_value || "-"}</p>
                <p className="mt-1 text-xs text-slate-400">Target: {item.target_value || "-"}</p>
                <p className="mt-1 text-xs text-slate-400">المدة: {item.start_date || "-"} إلى {item.end_date || "-"}</p>
                <p className="mt-1 text-xs text-slate-400">الهدف من الأفكار: {item.target_ideas}</p>

                <div className="mt-2 rounded-xl border border-slate-700 bg-slate-950/50 p-2 text-[11px] text-slate-300">
                  <p>In Scope: {item.scope_in || "-"}</p>
                  <p className="mt-1">Out of Scope: {item.scope_out || "-"}</p>
                  <p className="mt-1">القيود: {item.execution_constraints || "-"}</p>
                </div>

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
                      disabled={item.lifecycle_status === state || !canManageChallenges}
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
