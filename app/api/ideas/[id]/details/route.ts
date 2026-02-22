import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"

function formatDays(ms: number) {
  return Math.max(0, Math.round((ms / (1000 * 60 * 60 * 24)) * 10) / 10)
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const fetchIdea = async (withDepartment: boolean) =>
      supabaseAdmin
        .from("ideas")
        .select(withDepartment ? "*, challenges(title,department)" : "*, challenges(title)")
        .eq("id", id)
        .single()

    let { data: idea, error: ideaErr } = await fetchIdea(true)
    if (ideaErr && /department|challenges_\\d+\\.department/i.test(ideaErr.message || "")) {
      const retry = await fetchIdea(false)
      idea = retry.data
      ideaErr = retry.error
    }

    const [{ data: events, error: evErr }, { data: tasks, error: taskErr }, { data: files, error: fileErr }, { data: evaluations, error: evalErr }, { data: criteria, error: criteriaErr }] = await Promise.all([
      supabaseAdmin
        .from("idea_state_events")
        .select("id,from_state,to_state,action,notes,actor_id,actor_role,created_at")
        .eq("idea_id", id)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("tasks")
        .select("id,title,status,due_date,priority,progress,owner_name")
        .eq("idea_id", id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("idea_attachments")
        .select("id,file_name,file_type,file_size,uploaded_at")
        .eq("idea_id", id)
        .order("uploaded_at", { ascending: false }),
      supabaseAdmin
        .from("judging_evaluations")
        .select("evaluator_name,evaluator_role,comments,score,created_at,criterion_id")
        .eq("idea_id", id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("judging_criteria")
        .select("id")
    ])

    if (ideaErr) return NextResponse.json({ error: ideaErr.message }, { status: 500 })
    if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 })
    if (taskErr) return NextResponse.json({ error: taskErr.message }, { status: 500 })
    if (fileErr) return NextResponse.json({ error: fileErr.message }, { status: 500 })
    if (evalErr) return NextResponse.json({ error: evalErr.message }, { status: 500 })
    if (criteriaErr) return NextResponse.json({ error: criteriaErr.message }, { status: 500 })

    const stageDurations: Array<{ stage: string; days: number }> = []
    const ev = events || []
    for (let i = 0; i < ev.length; i++) {
      const current = ev[i]
      const next = ev[i + 1]
      if (!current?.to_state || !current?.created_at) continue

      const start = new Date(current.created_at).getTime()
      const end = next?.created_at ? new Date(next.created_at).getTime() : Date.now()
      stageDurations.push({
        stage: current.to_state,
        days: formatDays(end - start),
      })
    }

    const notes = (evaluations || [])
      .filter((item) => Boolean(item.comments))
      .map((item) => ({
        evaluator: item.evaluator_name,
        role: item.evaluator_role,
        comment: item.comments,
        score: item.score,
        at: item.created_at,
      }))

    const criteriaCount = Math.max(1, (criteria || []).length)
    const humanCount = (evaluations || []).filter((row) => row.evaluator_role === "human").length
    const humanRounds = Math.floor(humanCount / criteriaCount)
    const reevaluationCount = Math.max(0, humanRounds - 1)

    const aiScore = Number(idea.idea_quality_score || 0)
    const judgingScore = Number(idea.final_judging_score || 0)
    const progressSignals = Number(idea.self_clarity || 0) * 0.2 + Number(idea.self_readiness || 0) * 0.2 + Number(idea.self_feasibility || 0) * 0.2
    const successPrediction = Math.max(0, Math.min(100, Math.round(aiScore * 0.4 + judgingScore * 0.2 + progressSignals + (idea.state === "execution_in_progress" ? 10 : 0))))

    return NextResponse.json({
      data: {
        idea,
        stateEvents: ev,
        stageDurations,
        judgingNotes: notes,
        linkedTasks: tasks || [],
        attachments: files || [],
        expectedImpact: idea.expected_impact || null,
        reevaluationCount,
        successPrediction,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to load idea details" }, { status: 500 })
  }
}
