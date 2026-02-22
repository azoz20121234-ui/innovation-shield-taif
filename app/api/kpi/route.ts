import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type IdeaRecord = {
  id: string
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  reviewed_at?: string | null
  ip_status?: string | null
  ip_state?: string | null
  ip_file_url?: string | null
  ip_reference?: string | null
}

function normalize(value?: string | null) {
  return String(value || "").toLowerCase()
}

function isProtected(idea: IdeaRecord) {
  const ip = normalize(idea.ip_status || idea.ip_state)
  return (
    ["protected", "submitted", "registered"].includes(ip) ||
    Boolean(idea.ip_file_url || idea.ip_reference)
  )
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`
}

function stageOf(idea: IdeaRecord) {
  const status = normalize(idea.status)
  if (["execution", "implemented", "done", "inprogress"].includes(status)) return "execution"
  if (["prototype", "pilot"].includes(status)) return "prototype"
  if (["approved", "accepted"].includes(status)) return "approved"
  return "pending"
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const range = url.searchParams.get("range") || "90"
    const days = Number(range) > 0 ? Number(range) : 90

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase env vars are missing." }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .gte("created_at", fromDate.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const ideas = (data || []) as IdeaRecord[]

    const totalIdeas = ideas.length
    const protectedIdeas = ideas.filter(isProtected).length
    const prototypeIdeas = ideas.filter((idea) => ["prototype", "pilot", "execution", "implemented", "done"].includes(normalize(idea.status))).length
    const executionIdeas = ideas.filter((idea) =>
      ["execution", "implemented", "done", "inprogress"].includes(normalize(idea.status))
    ).length

    const transitionDays = ideas
      .map((idea) => {
        const status = normalize(idea.status)
        if (!["execution", "implemented", "done", "inprogress"].includes(status)) return null
        if (!idea.created_at || !idea.updated_at) return null

        const start = new Date(idea.created_at).getTime()
        const end = new Date(idea.updated_at).getTime()
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null

        return (end - start) / (1000 * 60 * 60 * 24)
      })
      .filter((value): value is number => value !== null)

    const avgTransitionDays =
      transitionDays.length > 0
        ? Math.round((transitionDays.reduce((sum, value) => sum + value, 0) / transitionDays.length) * 10) / 10
        : null

    const protectedRate = totalIdeas > 0 ? Math.round((protectedIdeas / totalIdeas) * 100) : 0
    const prototypeRate = totalIdeas > 0 ? Math.round((prototypeIdeas / totalIdeas) * 100) : 0
    const executionRate = totalIdeas > 0 ? Math.round((executionIdeas / totalIdeas) * 100) : 0

    const now = new Date()
    const monthsBack = days > 180 ? 12 : 6
    const months = Array.from({ length: monthsBack }, (_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - index), 1)
      return {
        key: toMonthKey(d),
        label: d.toLocaleDateString("ar-SA", { month: "short" }),
        ideas: 0,
        protected: 0,
        execution: 0,
      }
    })

    const heatmapRows = months.map((m) => ({
      month: m.label,
      pending: 0,
      approved: 0,
      prototype: 0,
      execution: 0,
      protected: 0,
    }))

    ideas.forEach((idea) => {
      if (!idea.created_at) return
      const d = new Date(idea.created_at)
      if (Number.isNaN(d.getTime())) return
      const key = toMonthKey(d)
      const month = months.find((m) => m.key === key)
      const heat = heatmapRows.find((m) => m.month === d.toLocaleDateString("ar-SA", { month: "short" }))
      if (!month || !heat) return

      month.ideas += 1
      if (isProtected(idea)) {
        month.protected += 1
        heat.protected += 1
      }
      if (stageOf(idea) === "execution") {
        month.execution += 1
      }

      const st = stageOf(idea)
      heat[st] += 1
    })

    const cards = [
      {
        key: "ideas",
        title: "عدد الأفكار",
        value: totalIdeas,
        unit: "",
        trend: months.map((m) => m.ideas),
        description: "إجمالي الأفكار ضمن الفترة المحددة.",
      },
      {
        key: "prototype",
        title: "نسبة الوصول للنموذج الأولي",
        value: prototypeRate,
        unit: "%",
        trend: months.map((m) => (m.ideas > 0 ? Math.round((m.execution / m.ideas) * 100) : 0)),
        description: "النسبة المئوية للأفكار التي وصلت لمرحلة النموذج الأولي أو بعدها.",
      },
      {
        key: "transition",
        title: "زمن الانتقال من فكرة إلى تنفيذ",
        value: avgTransitionDays ?? 0,
        unit: "يوم",
        trend: months.map((m) => m.execution),
        description: "متوسط الأيام من إنشاء الفكرة حتى دخول حالة تنفيذ (باستخدام updated_at).",
      },
      {
        key: "protection",
        title: "نسبة الأفكار المحمية",
        value: protectedRate,
        unit: "%",
        trend: months.map((m) => (m.ideas > 0 ? Math.round((m.protected / m.ideas) * 100) : 0)),
        description: "الأفكار التي لديها حالة حماية أو ملف حماية.",
      },
    ]

    const definitions = [
      {
        kpi: "عدد الأفكار",
        formula: "COUNT(ideas)",
        source: "جدول ideas",
        frequency: "يومي",
      },
      {
        kpi: "نسبة الوصول للنموذج الأولي",
        formula: "(عدد أفكار prototype/pilot/execution) / إجمالي الأفكار × 100",
        source: "ideas.status",
        frequency: "يومي",
      },
      {
        kpi: "زمن الانتقال من فكرة إلى تنفيذ",
        formula: "AVG(updated_at - created_at) للأفكار بحالة تنفيذ",
        source: "ideas.created_at, ideas.updated_at, ideas.status",
        frequency: "أسبوعي",
      },
      {
        kpi: "نسبة الأفكار المحمية",
        formula: "(عدد الأفكار ذات ip_status/ip_state أو ملف حماية) / إجمالي الأفكار × 100",
        source: "ideas.ip_status, ideas.ip_state, ideas.ip_file_url",
        frequency: "شهري",
      },
    ]

    return NextResponse.json({
      rangeDays: days,
      cards,
      trend: months,
      heatmap: heatmapRows,
      definitions,
      quickStats: {
        totalIdeas,
        prototypeRate,
        executionRate,
        protectedRate,
        avgTransitionDays,
      },
      exportedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ error: "Failed to build KPI report." }, { status: 500 })
  }
}

