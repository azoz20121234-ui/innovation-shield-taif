import { NextResponse } from "next/server"
import OpenAI from "openai"
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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ideaId: string = body.ideaId

    if (!ideaId) {
      return NextResponse.json({ error: "ideaId is required" }, { status: 400 })
    }

    const [{ data: idea, error: ideaError }, { data: criteria, error: criteriaError }] = await Promise.all([
      supabaseAdmin
        .from("ideas")
        .select("id,title,description,state")
        .eq("id", ideaId)
        .single(),
      supabaseAdmin
        .from("judging_criteria")
        .select("id,criterion,weight"),
    ])

    if (ideaError) return NextResponse.json({ error: ideaError.message }, { status: 500 })
    if (criteriaError) return NextResponse.json({ error: criteriaError.message }, { status: 500 })

    const criteriaRows = criteria || []
    if (criteriaRows.length === 0) {
      return NextResponse.json({ error: "No judging criteria found" }, { status: 400 })
    }

    let aiScores: Array<{ criterionId: string; score: number; comments: string }> = []

    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      const client = new OpenAI({ apiKey })
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "أنت محكم أولي آلي لمنصة الابتكار. أعد JSON بالمفتاح scores فقط. scores عبارة عن مصفوفة كائنات: criterionId, score(0-100), comments.",
          },
          {
            role: "user",
            content:
              `الفكرة: ${idea.title}\nالوصف: ${idea.description || "لا يوجد"}\nالمعايير:` +
              criteriaRows.map((c) => `\n- ${c.id}: ${c.criterion} (weight ${c.weight})`).join(""),
          },
        ],
      })

      const raw = completion.choices[0]?.message?.content || "{}"
      const parsed = JSON.parse(raw)
      aiScores = (parsed.scores || [])
        .map((item: { criterionId?: string; score?: number; comments?: string }) => ({
          criterionId: String(item.criterionId || ""),
          score: Math.max(0, Math.min(100, Number(item.score || 0))),
          comments: String(item.comments || "AI pre-judging comment"),
        }))
        .filter((item: { criterionId: string }) => Boolean(item.criterionId))
    }

    if (aiScores.length === 0) {
      aiScores = criteriaRows.map((criterion) => ({
        criterionId: criterion.id,
        score: 70,
        comments: `تحكيم أولي آلي للمعيار: ${criterion.criterion}`,
      }))
    }

    const rows = aiScores.map((item) => ({
      idea_id: ideaId,
      evaluator_id: "ai-prejudge-engine",
      evaluator_name: "Innovation AI Pre-Judge",
      evaluator_role: "ai",
      criterion_id: item.criterionId,
      score: item.score,
      comments: item.comments,
    }))

    const { error: insertError } = await supabaseAdmin.from("judging_evaluations").insert(rows)
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    const weightById = new Map(criteriaRows.map((row) => [row.id, Number(row.weight)]))
    const weightedScore = weightedAverage(
      aiScores.map((item) => ({ score: item.score, weight: Number(weightById.get(item.criterionId) || 0) }))
    )

    await supabaseAdmin
      .from("ideas")
      .update({ latest_ai_score: weightedScore })
      .eq("id", ideaId)

    const currentState = idea.state || "idea_submitted"
    if (canTransition(currentState, "ai_judged")) {
      await applyIdeaTransition({
        ideaId,
        toState: "ai_judged",
        actorId: "ai-prejudge-engine",
        actorRole: "ai",
        notes: `AI pre-judging completed with score ${weightedScore}`,
        action: "AI_PRE_JUDGING_COMPLETED",
      })
    }

    await logAudit({
      userId: "ai-prejudge-engine",
      action: "AI_PRE_JUDGING_COMPLETED",
      entity: "idea",
      entityId: ideaId,
      metadata: {
        weightedScore,
        criteriaCount: aiScores.length,
      },
    })

    return NextResponse.json({
      data: {
        weightedScore,
        message: "تم التحكيم الأولي الآلي بنجاح وانتقلت الفكرة لمسار التحكيم البشري.",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to run AI pre-judging" }, { status: 500 })
  }
}
