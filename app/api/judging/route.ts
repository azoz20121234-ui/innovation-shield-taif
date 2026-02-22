import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { applyIdeaTransition } from "@/lib/workflow/engine"
import { canTransition } from "@/lib/workflow/stateMachine"
import { logAudit } from "@/lib/workflow/audit"

function weightedAverage(rows: Array<{ score: number; weight: number }>) {
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0)
  if (!totalWeight) return 0
  const score = rows.reduce((sum, row) => sum + row.score * row.weight, 0)
  return Math.round((score / totalWeight) * 100) / 100
}

type CriterionRow = {
  id: string
  criterion: string
  weight: number
  template_id: string
}

type EvaluationRow = {
  idea_id: string
  evaluator_id: string | null
  evaluator_name: string
  evaluator_role: string
  criterion_id: string
  score: number
  comments: string | null
  created_at: string
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const ideaId = url.searchParams.get("ideaId")

  if (!ideaId) {
    return NextResponse.json({ error: "ideaId is required" }, { status: 400 })
  }

  const { data: idea, error: ideaErr } = await supabaseAdmin
    .from("ideas")
    .select("id,title,state,final_judging_score")
    .eq("id", ideaId)
    .single()

  if (ideaErr) return NextResponse.json({ error: ideaErr.message }, { status: 500 })

  const { data: criteria, error: criteriaErr } = await supabaseAdmin
    .from("judging_criteria")
    .select("id,criterion,weight,template_id")

  if (criteriaErr) return NextResponse.json({ error: criteriaErr.message }, { status: 500 })

  const { data: evaluations, error: evalErr } = await supabaseAdmin
    .from("judging_evaluations")
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: false })

  if (evalErr) return NextResponse.json({ error: evalErr.message }, { status: 500 })

  const criteriaById = new Map((criteria || []).map((c: CriterionRow) => [c.id, c]))

  const byEvaluator = ((evaluations || []) as EvaluationRow[]).reduce<Record<string, { name: string; role: string; rows: Array<{ score: number; weight: number }> }>>((acc, row) => {
    const key = `${row.evaluator_id || row.evaluator_name}-${row.evaluator_role}`
    const criterion = criteriaById.get(row.criterion_id)
    if (!criterion) return acc

    if (!acc[key]) {
      acc[key] = {
        name: row.evaluator_name,
        role: row.evaluator_role,
        rows: [],
      }
    }

    acc[key].rows.push({ score: row.score, weight: criterion.weight })
    return acc
  }, {})

  const evaluatorScores = Object.values(byEvaluator).map((entry) => ({
    evaluator: entry.name,
    role: entry.role,
    weightedScore: weightedAverage(entry.rows),
  }))

  const avg =
    evaluatorScores.length > 0
      ? Math.round((evaluatorScores.reduce((s, i) => s + i.weightedScore, 0) / evaluatorScores.length) * 100) /
        100
      : 0

  return NextResponse.json({
    data: {
      idea,
      criteria,
      evaluations,
      evaluatorScores,
      averageScore: avg,
    },
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const ideaId: string = body.ideaId
    const evaluatorId: string = body.evaluatorId || body.evaluatorName || "anonymous"
    const evaluatorName: string = body.evaluatorName || "Unnamed Evaluator"
    const evaluatorRole: string = body.evaluatorRole || "human"
    const scores: Array<{ criterionId: string; score: number; comments?: string }> = body.scores || []

    if (!ideaId || scores.length === 0) {
      return NextResponse.json({ error: "ideaId and scores are required" }, { status: 400 })
    }

    const { data: criteria } = await supabaseAdmin
      .from("judging_criteria")
      .select("id,weight")

    const weightById = new Map((criteria || []).map((c) => [c.id, c.weight]))

    const rows = scores.map((s) => ({
      idea_id: ideaId,
      evaluator_id: evaluatorId,
      evaluator_name: evaluatorName,
      evaluator_role: evaluatorRole,
      criterion_id: s.criterionId,
      score: s.score,
      comments: s.comments || null,
    }))

    const { error: insertError } = await supabaseAdmin.from("judging_evaluations").insert(rows)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    const weightedRows = scores
      .map((s) => ({ score: s.score, weight: Number(weightById.get(s.criterionId) || 0) }))
      .filter((r) => r.weight > 0)

    const thisScore = weightedAverage(weightedRows)

    const { data: idea } = await supabaseAdmin
      .from("ideas")
      .select("state")
      .eq("id", ideaId)
      .single()

    const currentState = idea?.state || "idea_submitted"

    if (evaluatorRole === "ai") {
      await supabaseAdmin
        .from("ideas")
        .update({ latest_ai_score: thisScore })
        .eq("id", ideaId)

      if (canTransition(currentState, "ai_judged")) {
        await applyIdeaTransition({
          ideaId,
          toState: "ai_judged",
          actorId: evaluatorId,
          actorRole: "ai",
          notes: `AI weighted score: ${thisScore}`,
          action: "AI_JUDGING_COMPLETED",
        })
      }
    } else {
      const { data: allRows } = await supabaseAdmin
        .from("judging_evaluations")
        .select("criterion_id,score")
        .eq("idea_id", ideaId)
        .eq("evaluator_role", "human")

      const average = weightedAverage(
        ((allRows || []) as Array<{ criterion_id: string; score: number }>).map((r) => ({
          score: r.score,
          weight: Number(weightById.get(r.criterion_id) || 0),
        }))
      )

      await supabaseAdmin
        .from("ideas")
        .update({ final_judging_score: average })
        .eq("id", ideaId)

      const postHumanState = (await supabaseAdmin
        .from("ideas")
        .select("state")
        .eq("id", ideaId)
        .single()).data?.state || currentState

      if (canTransition(postHumanState, "human_judged")) {
        await applyIdeaTransition({
          ideaId,
          toState: "human_judged",
          actorId: evaluatorId,
          actorRole: "committee",
          notes: `Human weighted average: ${average}`,
          action: "HUMAN_JUDGING_COMPLETED",
        })
      }
    }

    await logAudit({
      userId: evaluatorId,
      action: "JUDGING_SUBMITTED",
      entity: "idea",
      entityId: ideaId,
      metadata: { evaluatorName, evaluatorRole, scoreCount: scores.length },
    })

    return NextResponse.json({ data: { weightedScore: thisScore } })
  } catch {
    return NextResponse.json({ error: "Failed to submit judging" }, { status: 500 })
  }
}
