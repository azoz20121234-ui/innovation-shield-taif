"use client"

import Link from "next/link"
import { Noto_Kufi_Arabic } from "next/font/google"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  HeartPulse,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Siren,
  Stethoscope,
  Timer,
} from "lucide-react"

type KpiResponse = {
  cards: Array<{ key: string; title: string; value: number; unit?: string }>
  quickStats: {
    totalIdeas: number
    prototypeRate: number
    executionRate: number
    protectedRate: number
    avgTransitionDays: number | null
  }
  exportedAt: string
}

type ChallengesResponse = {
  data: Array<{ id: string; title: string; lifecycle_status: string; metrics: { ideasCount: number } }>
  dashboard: {
    effectivenessSummary: { effective: number; average: number; weak: number }
    noIdeas: Array<{ id: string; title: string }>
  }
}

type Task = {
  id: string
  title: string
  owner_name: string | null
  status: "todo" | "inprogress" | "blocked" | "done"
  priority: "high" | "medium" | "low"
  due_date: string | null
}

type TasksResponse = { data: Task[] }

const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
})

const statusOptions = [
  { value: "all", label: "كل الحالات" },
  { value: "todo", label: "جديدة" },
  { value: "inprogress", label: "قيد التنفيذ" },
  { value: "blocked", label: "متعثرة" },
  { value: "done", label: "مكتملة" },
]

function formatDate(value: string | null) {
  if (!value) return "بدون تاريخ"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "تاريخ غير صالح"
  return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" })
}

export default function HomePage() {
  const [range, setRange] = useState("90")
  const [taskStatus, setTaskStatus] = useState("all")

  const [kpiData, setKpiData] = useState<KpiResponse | null>(null)
  const [challengeData, setChallengeData] = useState<ChallengesResponse | null>(null)
  const [tasksData, setTasksData] = useState<Task[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isBackgroundRefresh = false) => {
    if (isBackgroundRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      setError(null)
      const taskQuery = taskStatus === "all" ? "" : `?status=${taskStatus}`

      const [kpiRes, challengesRes, tasksRes] = await Promise.all([
        fetch(`/api/kpi?range=${range}`, { cache: "no-store" }),
        fetch("/api/challenges", { cache: "no-store" }),
        fetch(`/api/tasks${taskQuery}`, { cache: "no-store" }),
      ])

      if (!kpiRes.ok || !challengesRes.ok || !tasksRes.ok) {
        throw new Error("تعذر تحميل بيانات المنصة حالياً. تحقق من الاتصال وإعدادات البيئة.")
      }

      const kpiJson = (await kpiRes.json()) as KpiResponse
      const challengesJson = (await challengesRes.json()) as ChallengesResponse
      const tasksJson = (await tasksRes.json()) as TasksResponse

      setKpiData(kpiJson)
      setChallengeData(challengesJson)
      setTasksData(tasksJson.data.slice(0, 6))
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [range, taskStatus])

  useEffect(() => {
    void loadData(false)
  }, [loadData])

  useEffect(() => {
    const interval = setInterval(() => {
      void loadData(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [loadData])

  const quickStats = useMemo(() => {
    if (!kpiData) {
      return [
        { label: "عدد الأفكار", value: "—", icon: Activity },
        { label: "نسبة التنفيذ", value: "—", icon: Stethoscope },
        { label: "نسبة الحماية", value: "—", icon: ShieldCheck },
        { label: "متوسط زمن الانتقال", value: "—", icon: Timer },
      ]
    }

    return [
      { label: "عدد الأفكار", value: `${kpiData.quickStats.totalIdeas}`, icon: Activity },
      { label: "نسبة التنفيذ", value: `${kpiData.quickStats.executionRate}%`, icon: Stethoscope },
      { label: "نسبة الحماية", value: `${kpiData.quickStats.protectedRate}%`, icon: ShieldCheck },
      {
        label: "متوسط زمن الانتقال",
        value: `${kpiData.quickStats.avgTransitionDays ?? 0} يوم`,
        icon: Timer,
      },
    ]
  }, [kpiData])

  return (
    <main className={`${kufi.className} min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100`} dir="rtl">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <header className="sticky top-4 z-10 mb-6 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-sky-200">Hajj Health Monitoring</p>
              <h1 className="text-xl font-extrabold sm:text-2xl">منصة صحية تفاعلية - نمط Apple Health</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link href="/dashboard" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/20">
                لوحة التحكم
              </Link>
              <Link href="/dashboard/kpi" className="rounded-full border border-sky-300/50 bg-sky-400/20 px-4 py-2 hover:bg-sky-400/30">
                الإنذارات والمؤشرات
              </Link>
              <button
                onClick={() => void loadData(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 hover:bg-white/15"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                تحديث
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-400/20 px-3 py-1 text-xs text-rose-50">
                <HeartPulse size={14} /> تحديث لحظي كل 30 ثانية
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">تشغيل ميداني حقيقي بدلاً من صفحة تعريفية ثابتة</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                هذه الواجهة مرتبطة بمسارات API الفعلية في المشروع وتعرض المؤشرات، حالة التحديات، وآخر المهام التشغيلية مع
                فلاتر مباشرة.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <label className="rounded-full border border-white/15 px-3 py-2">
                المدى الزمني
                <select
                  className="mr-2 bg-transparent text-sm outline-none"
                  value={range}
                  onChange={(event) => setRange(event.target.value)}
                >
                  <option value="30" className="text-slate-900">30 يوم</option>
                  <option value="90" className="text-slate-900">90 يوم</option>
                  <option value="180" className="text-slate-900">180 يوم</option>
                  <option value="365" className="text-slate-900">سنة</option>
                </select>
              </label>
              <label className="rounded-full border border-white/15 px-3 py-2">
                حالة المهمة
                <select
                  className="mr-2 bg-transparent text-sm outline-none"
                  value={taskStatus}
                  onChange={(event) => setTaskStatus(event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="text-slate-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/15 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
                <div className="mb-2 inline-flex rounded-xl border border-white/20 bg-white/10 p-2">
                  <Icon size={17} />
                </div>
                <p className="text-xs text-slate-300">{card.label}</p>
                <p className="mt-1 text-2xl font-extrabold">{card.value}</p>
              </article>
            )
          })}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <h3 className="mb-4 text-lg font-bold">ملخص فعالية التحديات</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Loader2 size={16} className="animate-spin" />
                جاري تحميل بيانات التحديات...
              </div>
            ) : challengeData ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3">
                  <span>تحديات فعّالة</span>
                  <strong>{challengeData.dashboard.effectivenessSummary.effective}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-400/10 p-3">
                  <span>تحديات متوسطة</span>
                  <strong>{challengeData.dashboard.effectivenessSummary.average}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-rose-300/20 bg-rose-400/10 p-3">
                  <span>تحديات تحتاج تدخل</span>
                  <strong>{challengeData.dashboard.effectivenessSummary.weak}</strong>
                </div>
                <p className="text-xs text-slate-400">تحديات بدون أفكار: {challengeData.dashboard.noIdeas.length}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">لا توجد بيانات متاحة حالياً.</p>
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">آخر المهام التشغيلية</h3>
              <Link href="/dashboard/tasks" className="inline-flex items-center gap-1 text-sm text-sky-200 hover:text-sky-100">
                كل المهام
                <ArrowUpRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Loader2 size={16} className="animate-spin" />
                جاري تحميل المهام...
              </div>
            ) : tasksData.length > 0 ? (
              <ul className="space-y-2">
                {tasksData.map((task) => (
                  <li key={task.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{task.title}</p>
                      <span className="text-xs text-slate-300">{formatDate(task.due_date)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                      <ClipboardList size={12} />
                      الحالة: {task.status}
                      <span className="mx-1">•</span>
                      الأولوية: {task.priority}
                      <span className="mx-1">•</span>
                      المالك: {task.owner_name || "غير محدد"}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 bg-black/20 p-4 text-sm text-slate-400">
                لا توجد مهام مطابقة للفلاتر الحالية.
              </div>
            )}
          </article>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/kpi" className="rounded-2xl border border-sky-300/20 bg-sky-500/10 p-5 hover:bg-sky-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">مركز الإنذارات الصحية</h3>
              <Siren size={18} />
            </div>
            <p className="mt-2 text-sm text-slate-200">استعرض مؤشرات الخطر، التحليلات التنبؤية، ونسب التدهور الميداني.</p>
          </Link>

          <Link href="/dashboard/challenges" className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-5 hover:bg-amber-500/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">تحديات تحتاج استجابة</h3>
              <AlertTriangle size={18} />
            </div>
            <p className="mt-2 text-sm text-slate-200">
              {challengeData?.dashboard.noIdeas.length ?? 0} تحديات مفتوحة بلا أفكار؛ يمكن التدخل لإعادة صياغتها أو تحفيز
              الفرق.
            </p>
          </Link>
        </section>
      </div>
    </main>
  )
}
