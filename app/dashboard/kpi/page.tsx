"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Download, RefreshCw } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { supabase } from "@/lib/supabaseClient"

type KpiCard = {
  key: string
  title: string
  value: number
  unit: string
  trend: number[]
  description: string
}

type TrendPoint = {
  key: string
  label: string
  ideas: number
  protected: number
  execution: number
}

type HeatmapRow = {
  month: string
  pending: number
  approved: number
  prototype: number
  execution: number
  protected: number
}

type Definition = {
  kpi: string
  formula: string
  source: string
  frequency: string
}

type KpiResponse = {
  rangeDays: number
  cards: KpiCard[]
  trend: TrendPoint[]
  heatmap: HeatmapRow[]
  definitions: Definition[]
  exportedAt: string
}

const rangeOptions = [
  { label: "30 يوم", value: 30 },
  { label: "90 يوم", value: 90 },
  { label: "180 يوم", value: 180 },
  { label: "365 يوم", value: 365 },
]

function Sparkline({ data }: { data: number[] }) {
  const width = 150
  const height = 36
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={width} height={height} className="mt-3">
      <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="2.4" />
    </svg>
  )
}

function heatColor(value: number, maxValue: number) {
  const ratio = maxValue > 0 ? value / maxValue : 0
  if (ratio === 0) return "bg-slate-900/50"
  if (ratio < 0.34) return "bg-sky-900/50"
  if (ratio < 0.67) return "bg-sky-700/55"
  return "bg-sky-500/65"
}

export default function KPIPage() {
  const [rangeDays, setRangeDays] = useState(90)
  const [data, setData] = useState<KpiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchKpi = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/kpi?range=${rangeDays}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "تعذر تحميل بيانات المؤشرات")
      }

      setData(json as KpiResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      if (!isSilent) setLoading(false)
      setRefreshing(false)
    }
  }, [rangeDays])

  useEffect(() => {
    void fetchKpi()
  }, [fetchKpi])

  useEffect(() => {
    const timer = setInterval(() => {
      void fetchKpi(true)
    }, 60000)

    const channel = supabase
      .channel("kpi-live-ideas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ideas" },
        () => {
          void fetchKpi(true)
        }
      )
      .subscribe()

    return () => {
      clearInterval(timer)
      void supabase.removeChannel(channel)
    }
  }, [fetchKpi])

  const maxHeat = useMemo(() => {
    if (!data) return 0
    return Math.max(
      ...data.heatmap.flatMap((row) => [
        row.pending,
        row.approved,
        row.prototype,
        row.execution,
        row.protected,
      ]),
      0
    )
  }, [data])

  const exportCsv = () => {
    if (!data) return

    const header = "KPI,Formula,Source,Frequency"
    const rows = data.definitions.map((item) =>
      [item.kpi, item.formula, item.source, item.frequency]
        .map((v) => `\"${String(v).replaceAll("\"", "\"\"")}\"`)
        .join(",")
    )

    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `kpi-report-${data.rangeDays}d.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-100">لوحة مؤشرات الابتكار التفاعلية</h1>
            <p className="mt-2 text-sm text-slate-300">
              عرض بصري فوري للمؤشرات مع اتجاهات زمنية، تعريفات KPI، وتحديثات ديناميكية.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRefreshing(true)
                void fetchKpi(true)
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              تحديث
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-medium text-white"
            >
              <Download size={14} />
              تصدير التقرير
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setRangeDays(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                rangeDays === option.value
                  ? "bg-sky-500 text-white"
                  : "border border-slate-700 bg-slate-900/70 text-slate-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/dashboard/challenges"
          className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-100 transition hover:border-sky-400"
        >
          <p className="text-sm font-semibold">فتح تحدي</p>
          <p className="mt-1 text-xs text-slate-300">إطلاق تحدي جديد مع مؤشرات نجاح</p>
        </Link>
        <Link
          href="/dashboard/new-idea"
          className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-100 transition hover:border-sky-400"
        >
          <p className="text-sm font-semibold">إنشاء فكرة جديدة</p>
          <p className="mt-1 text-xs text-slate-300">ربط الفكرة مباشرة بمسار التحكيم</p>
        </Link>
        <Link
          href="/dashboard/tasks"
          className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-100 transition hover:border-sky-400"
        >
          <p className="text-sm font-semibold">توزيع المهام</p>
          <p className="mt-1 text-xs text-slate-300">إدارة تنفيذ المبادرات المعتمدة</p>
        </Link>
        <Link
          href="/dashboard/ai"
          className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-100 transition hover:border-sky-400"
        >
          <p className="text-sm font-semibold">تحليل AI</p>
          <p className="mt-1 text-xs text-slate-300">تقييم سريع للجدوى والمخاطر</p>
        </Link>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-6 text-slate-300">
          جارٍ تحميل المؤشرات...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-6 text-red-200">
          {error}
        </div>
      )}

      {data && !loading && !error && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.cards.map((card) => (
              <div key={card.key} className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
                <p className="text-sm text-slate-300">{card.title}</p>
                <p className="mt-1 text-3xl font-semibold text-slate-100">
                  {card.value}
                  <span className="mr-1 text-sm text-slate-300">{card.unit}</span>
                </p>
                <p className="mt-1 text-xs text-slate-400">{card.description}</p>
                <Sparkline data={card.trend} />
              </div>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="h-96 rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
              <h2 className="mb-3 text-lg font-semibold text-slate-100">اتجاهات الأفكار والتنفيذ</h2>
              <ResponsiveContainer width="100%" height="88%">
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="label" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(148,163,184,0.35)",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ideas" name="الأفكار" stroke="#38bdf8" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="execution" name="التنفيذ" stroke="#22c55e" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="protected" name="المحمية" stroke="#f59e0b" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
              <h2 className="mb-3 text-lg font-semibold text-slate-100">تدفق المؤشرات الشهرية</h2>
              <ResponsiveContainer width="100%" height="88%">
                <AreaChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="label" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(148,163,184,0.35)",
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="ideas" name="أفكار" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} />
                  <Area type="monotone" dataKey="execution" name="تنفيذ" stroke="#4ade80" fill="#4ade80" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="h-96 rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
              <h2 className="mb-3 text-lg font-semibold text-slate-100">مقارنة التنفيذ والحماية</h2>
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="label" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(148,163,184,0.35)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="execution" name="تنفيذ" fill="#22c55e" />
                  <Bar dataKey="protected" name="محمي" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
              <h2 className="mb-3 text-lg font-semibold text-slate-100">Heatmap المراحل</h2>
              <div className="overflow-auto">
                <table className="w-full border-separate border-spacing-2 text-xs">
                  <thead>
                    <tr className="text-slate-300">
                      <th className="text-right font-medium">الشهر</th>
                      <th>Pending</th>
                      <th>Approved</th>
                      <th>Prototype</th>
                      <th>Execution</th>
                      <th>Protected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.heatmap.map((row) => (
                      <tr key={row.month}>
                        <td className="rounded-lg bg-slate-950/60 px-2 py-1 text-right text-slate-200">{row.month}</td>
                        <td className={`rounded-lg px-2 py-1 text-center text-slate-100 ${heatColor(row.pending, maxHeat)}`}>{row.pending}</td>
                        <td className={`rounded-lg px-2 py-1 text-center text-slate-100 ${heatColor(row.approved, maxHeat)}`}>{row.approved}</td>
                        <td className={`rounded-lg px-2 py-1 text-center text-slate-100 ${heatColor(row.prototype, maxHeat)}`}>{row.prototype}</td>
                        <td className={`rounded-lg px-2 py-1 text-center text-slate-100 ${heatColor(row.execution, maxHeat)}`}>{row.execution}</td>
                        <td className={`rounded-lg px-2 py-1 text-center text-slate-100 ${heatColor(row.protected, maxHeat)}`}>{row.protected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-100">تعريفات المؤشرات (Formula + Source + Frequency)</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300">
                    <th className="px-2 py-2 text-right">KPI</th>
                    <th className="px-2 py-2 text-right">الصيغة الحسابية</th>
                    <th className="px-2 py-2 text-right">مصدر البيانات</th>
                    <th className="px-2 py-2 text-right">تردد التحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {data.definitions.map((item) => (
                    <tr key={item.kpi} className="border-b border-slate-800/80 text-slate-200">
                      <td className="px-2 py-2">{item.kpi}</td>
                      <td className="px-2 py-2 text-slate-300">{item.formula}</td>
                      <td className="px-2 py-2 text-slate-300">{item.source}</td>
                      <td className="px-2 py-2">{item.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
