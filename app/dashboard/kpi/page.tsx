"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from @/lib/supabaseClient"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"

type IdeaRecord = {
  id: string
  status?: string | null
  created_at?: string | null
  submitted_at?: string | null
  reviewed_at?: string | null
  ip_status?: string | null
  ip_state?: string | null
  ip_file_url?: string | null
  ip_reference?: string | null
}

function normalizeStatus(status?: string | null) {
  return String(status || "").toLowerCase()
}

export default function KPIPage() {
  const [ideas, setIdeas] = useState<IdeaRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from("ideas").select("*")
      setIdeas((data || []) as IdeaRecord[])
      setLoading(false)
    }

    fetchData()
  }, [])

  const totalIdeas = ideas.length
  const pendingCount = ideas.filter((idea) =>
    ["pending", "under_review", "submitted"].includes(normalizeStatus(idea.status))
  ).length
  const approvedCount = ideas.filter((idea) =>
    ["approved", "accepted"].includes(normalizeStatus(idea.status))
  ).length
  const executionCount = ideas.filter((idea) =>
    ["execution", "implemented", "done", "pilot", "inprogress"].includes(
      normalizeStatus(idea.status)
    )
  ).length
  const protectedCount = ideas.filter((idea) => {
    const ip = String(idea.ip_status || idea.ip_state || "").toLowerCase()
    return (
      ["protected", "submitted", "registered"].includes(ip) ||
      Boolean(idea.ip_file_url || idea.ip_reference)
    )
  }).length

  const conversionRate = totalIdeas > 0 ? Math.round((approvedCount / totalIdeas) * 100) : 0
  const executionRate = approvedCount > 0 ? Math.round((executionCount / approvedCount) * 100) : 0
  const ipProtectionRate =
    executionCount > 0 ? Math.round((protectedCount / executionCount) * 100) : 0

  const averageReviewDays = useMemo(() => {
    const days = ideas
      .map((idea) => {
        const start = idea.submitted_at || idea.created_at
        const end = idea.reviewed_at
        if (!start || !end) return null

        const startDate = new Date(start).getTime()
        const endDate = new Date(end).getTime()
        if (Number.isNaN(startDate) || Number.isNaN(endDate) || endDate < startDate) {
          return null
        }

        return (endDate - startDate) / (1000 * 60 * 60 * 24)
      })
      .filter((value): value is number => value !== null)

    if (days.length === 0) return null
    const avg = days.reduce((sum, day) => sum + day, 0) / days.length
    return Math.round(avg * 10) / 10
  }, [ideas])

  const lifecycleData = [
    { name: "قيد المراجعة", value: pendingCount, color: "#67e8f9" },
    { name: "معتمدة", value: approvedCount, color: "#22d3ee" },
    { name: "قيد التنفيذ", value: executionCount, color: "#34d399" },
    { name: "محمية ملكيًا", value: protectedCount, color: "#facc15" },
  ]

  const monthlyTrend = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      return {
        key,
        monthLabel: date.toLocaleDateString("ar-SA", { month: "short" }),
        ideas: 0,
      }
    })

    ideas.forEach((idea) => {
      if (!idea.created_at) return
      const date = new Date(idea.created_at)
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = months.find((item) => item.key === key)
      if (bucket) bucket.ideas += 1
    })

    return months
  }, [ideas])

  const kpiCards = [
    {
      label: "إجمالي الأفكار",
      value: totalIdeas.toString(),
      note: "عدد الأفكار المسجلة في المنصة.",
    },
    {
      label: "معدل التحويل",
      value: `${conversionRate}%`,
      note: "نسبة انتقال الأفكار من تسجيل إلى اعتماد.",
    },
    {
      label: "نسبة التنفيذ",
      value: `${executionRate}%`,
      note: "نسبة الأفكار المعتمدة التي دخلت التنفيذ.",
    },
    {
      label: "حماية الملكية",
      value: `${ipProtectionRate}%`,
      note: "نسبة المبادرات المنفذة التي لديها ملف حماية.",
    },
    {
      label: "متوسط زمن التحكيم",
      value: averageReviewDays === null ? "--" : `${averageReviewDays} يوم`,
      note: "الفترة من تقديم الفكرة حتى التقييم الرسمي.",
    },
    {
      label: "الأفكار قيد المراجعة",
      value: pendingCount.toString(),
      note: "الحالة الحالية التي تحتاج متابعة اللجان.",
    },
  ]

  return (
    <div dir="rtl" className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-semibold">لوحة مؤشرات دورة الابتكار</h1>
        <p className="mt-3 text-white/75">
          متابعة كاملة من فكرة إلى تنفيذ وحماية ملكية فكرية مع مؤشرات تشغيلية
          قابلة للقياس.
        </p>
      </section>

      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          جارٍ تحميل بيانات المؤشرات...
        </div>
      )}

      {!loading && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <p className="text-sm text-white/70">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-cyan-200">{card.value}</p>
                <p className="mt-2 text-xs text-white/60">{card.note}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="h-96 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-xl font-semibold">توزيع مراحل الابتكار</h2>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={lifecycleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                  <XAxis dataKey="name" stroke="#d1d5db" />
                  <YAxis stroke="#d1d5db" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="عدد الأفكار" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-96 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-xl font-semibold">اتجاه تسجيل الأفكار (6 أشهر)</h2>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                  <XAxis dataKey="monthLabel" stroke="#d1d5db" />
                  <YAxis stroke="#d1d5db" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ideas"
                    name="أفكار جديدة"
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{ fill: "#34d399", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-xl font-semibold">نسب دورة الحياة</h2>
            <div className="flex justify-center">
              <PieChart width={480} height={320}>
                <Pie
                  data={lifecycleData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={120}
                  label
                >
                  {lifecycleData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                />
              </PieChart>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
