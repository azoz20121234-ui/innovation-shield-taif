import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type IdeaRecord = {
  id: string
  challenge_id?: string | null
  state?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  reviewed_at?: string | null
  ip_status?: string | null
  ip_state?: string | null
  ip_file_url?: string | null
  ip_reference?: string | null
  final_judging_score?: number | null
}

type ChallengeRecord = {
  id: string
  department?: string | null
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function stageOf(idea: IdeaRecord) {
  const state = normalize(idea.state)
  const status = normalize(idea.status)

  if (["execution_in_progress", "impact_tracking", "protected_published", "approved_for_execution"].includes(state)) return "execution"
  if (["prototype_ready", "team_formed", "ai_refined"].includes(state)) return "prototype"
  if (["human_judged", "ai_judged"].includes(state)) return "approved"

  if (["execution", "implemented", "done", "inprogress"].includes(status)) return "execution"
  if (["prototype", "pilot"].includes(status)) return "prototype"
  if (["approved", "accepted"].includes(status)) return "approved"
  return "pending"
}

function regressionForecast(history: number[], points = 3) {
  if (history.length === 0) return Array.from({ length: points }, () => 0)
  if (history.length === 1) return Array.from({ length: points }, () => history[0])

  const n = history.length
  const xMean = (n - 1) / 2
  const yMean = history.reduce((sum, v) => sum + v, 0) / n

  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (history[i] - yMean)
    den += (i - xMean) ** 2
  }

  const slope = den === 0 ? 0 : num / den
  const intercept = yMean - slope * xMean

  return Array.from({ length: points }, (_, idx) => {
    const x = n + idx
    return Math.max(0, Math.round(intercept + slope * x))
  })
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

    const [ideasRes, challengesRes] = await Promise.all([
      supabase
        .from("ideas")
        .select("*")
        .gte("created_at", fromDate.toISOString())
        .order("created_at", { ascending: true }),
      supabase
        .from("challenges")
        .select("id,department"),
    ])

    if (ideasRes.error) {
      return NextResponse.json({ error: ideasRes.error.message }, { status: 500 })
    }

    if (challengesRes.error) {
      return NextResponse.json({ error: challengesRes.error.message }, { status: 500 })
    }

    const ideas = (ideasRes.data || []) as IdeaRecord[]
    const challenges = (challengesRes.data || []) as ChallengeRecord[]

    const challengeDept = new Map(challenges.map((row) => [row.id, row.department || "غير مصنف"]))

    const totalIdeas = ideas.length
    const protectedIdeas = ideas.filter(isProtected).length
    const prototypeIdeas = ideas.filter((idea) => ["prototype", "approved", "execution"].includes(stageOf(idea))).length
    const executionIdeas = ideas.filter((idea) => stageOf(idea) === "execution").length

    const transitionDays = ideas
      .map((idea) => {
        if (stageOf(idea) !== "execution") return null
        if (!idea.created_at || !idea.updated_at) return null

        const start = new Date(idea.created_at).getTime()
        const end = new Date(idea.updated_at).getTime()
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null

        return (end - start) / (1000 * 60 * 60 * 24)
      })
      .filter((value): value is number => value !== null)

    const avgTransitionDays = transitionDays.length > 0
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
        prototype: 0,
        approved: 0,
        pending: 0,
      }
    })

    const monthMap = new Map(months.map((row) => [row.key, row]))

    ideas.forEach((idea) => {
      if (!idea.created_at) return
      const d = new Date(idea.created_at)
      if (Number.isNaN(d.getTime())) return
      const key = toMonthKey(d)
      const row = monthMap.get(key)
      if (!row) return

      row.ideas += 1
      const stage = stageOf(idea)
      row[stage] += 1
      if (isProtected(idea)) row.protected += 1
      if (stage === "execution") row.execution += 1
    })

    const heatmapRows = months.map((m) => ({
      month: m.label,
      pending: m.pending,
      approved: m.approved,
      prototype: m.prototype,
      execution: m.execution,
      protected: m.protected,
    }))

    const ideasForecast = regressionForecast(months.map((m) => m.ideas), 3)
    const executionForecast = regressionForecast(months.map((m) => m.execution), 3)
    const protectedForecast = regressionForecast(months.map((m) => m.protected), 3)

    const forecastMonths = Array.from({ length: 3 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() + idx + 1, 1)
      return {
        key: toMonthKey(d),
        label: d.toLocaleDateString("ar-SA", { month: "short" }),
        ideas: ideasForecast[idx],
        execution: executionForecast[idx],
        protected: protectedForecast[idx],
      }
    })

    const deptMap = new Map<string, { department: string; ideas: number; execution: number; protected: number; judgedScores: number[] }>()
    ideas.forEach((idea) => {
      const department = challengeDept.get(idea.challenge_id || "") || "غير مصنف"
      const row = deptMap.get(department) || { department, ideas: 0, execution: 0, protected: 0, judgedScores: [] }
      row.ideas += 1
      if (stageOf(idea) === "execution") row.execution += 1
      if (isProtected(idea)) row.protected += 1
      if (idea.final_judging_score !== null && idea.final_judging_score !== undefined) {
        row.judgedScores.push(Number(idea.final_judging_score))
      }
      deptMap.set(department, row)
    })

    const departmentComparison = Array.from(deptMap.values())
      .map((row) => ({
        department: row.department,
        ideas: row.ideas,
        executionRate: row.ideas > 0 ? Math.round((row.execution / row.ideas) * 100) : 0,
        protectionRate: row.ideas > 0 ? Math.round((row.protected / row.ideas) * 100) : 0,
        qualityScore: row.judgedScores.length > 0 ? Math.round((row.judgedScores.reduce((s, v) => s + v, 0) / row.judgedScores.length) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.ideas - a.ideas)

    const avgJudgingScore = ideas
      .filter((idea) => idea.final_judging_score !== null && idea.final_judging_score !== undefined)
      .reduce((sum, idea, _, arr) => sum + Number(idea.final_judging_score) / arr.length, 0)

    const impactMetrics = {
      estimatedFinancialSavingSar: executionIdeas * 120000,
      qualityImprovementIndex: Math.round((avgJudgingScore || 0) * 10) / 10,
      patientExperienceIndex: Math.round((executionRate * 0.6 + prototypeRate * 0.4) * 10) / 10,
      averageTimeToImpactDays: avgTransitionDays || 0,
      protectedIdeasImpactRate: protectedRate,
    }

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
        trend: months.map((m) => (m.ideas > 0 ? Math.round((m.prototype / m.ideas) * 100) : 0)),
        description: "النسبة المئوية للأفكار التي وصلت للنموذج الأولي أو بعدها.",
      },
      {
        key: "transition",
        title: "زمن الانتقال من فكرة إلى تنفيذ",
        value: avgTransitionDays ?? 0,
        unit: "يوم",
        trend: months.map((m) => m.execution),
        description: "متوسط الأيام من إنشاء الفكرة حتى دخول حالة تنفيذ.",
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
        source: "ideas.state / ideas.status",
        frequency: "يومي",
      },
      {
        kpi: "زمن الانتقال من فكرة إلى تنفيذ",
        formula: "AVG(updated_at - created_at) للأفكار في التنفيذ",
        source: "ideas.created_at, ideas.updated_at, ideas.state",
        frequency: "أسبوعي",
      },
      {
        kpi: "نسبة الأفكار المحمية",
        formula: "(عدد الأفكار المحمية) / إجمالي الأفكار × 100",
        source: "ideas.ip_status, ideas.ip_state, ideas.ip_file_url",
        frequency: "شهري",
      },
      {
        kpi: "وفورات مالية تقديرية",
        formula: "عدد أفكار التنفيذ × متوسط وفر معياري",
        source: "ideas.state + معامل تقديري PMO",
        frequency: "شهري",
      },
    ]

    return NextResponse.json({
      rangeDays: days,
      cards,
      trend: months,
      trendForecast: forecastMonths,
      heatmap: heatmapRows,
      departmentComparison,
      impactMetrics,
      drilldown: {
        byState: {
          pending: ideas.filter((idea) => stageOf(idea) === "pending").length,
          approved: ideas.filter((idea) => stageOf(idea) === "approved").length,
          prototype: ideas.filter((idea) => stageOf(idea) === "prototype").length,
          execution: ideas.filter((idea) => stageOf(idea) === "execution").length,
          protected: protectedIdeas,
        },
        byDepartment: departmentComparison,
        byMonth: months,
      },
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
