import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const state = url.searchParams.get("state")
  const department = url.searchParams.get("department")
  const challengeId = url.searchParams.get("challengeId")
  const maturityLevel = url.searchParams.get("maturityLevel")
  const impactContains = url.searchParams.get("impactContains")

  let query = supabaseAdmin
    .from("ideas")
    .select("*, challenges(id,title,department)")
    .order("created_at", { ascending: false })

  if (state) query = query.eq("state", state)
  if (challengeId) query = query.eq("challenge_id", challengeId)
  if (maturityLevel) query = query.eq("maturity_level", maturityLevel)
  if (department) query = query.eq("challenges.department", department)
  if (impactContains) query = query.ilike("expected_impact", `%${impactContains}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const qualityScoreRaw = Number(body.ideaQualityScore)
    const qualityScore =
      Number.isFinite(qualityScoreRaw) && qualityScoreRaw >= 0
        ? Math.max(0, Math.min(100, qualityScoreRaw))
        : null

    const { data, error } = await supabaseAdmin
      .from("ideas")
      .insert({
        challenge_id: body.challengeId || null,
        team_id: body.teamId || null,
        title: body.title,
        description: body.description || null,
        problem_statement: body.problemStatement || null,
        proposed_solution: body.proposedSolution || null,
        added_value: body.addedValue || null,
        target_audience: body.targetAudience || null,
        expected_impact: body.expectedImpact || null,
        potential_risks: body.potentialRisks || null,
        maturity_level: body.maturityLevel || "idea",
        self_clarity: body.selfClarity ?? null,
        self_readiness: body.selfReadiness ?? null,
        self_feasibility: body.selfFeasibility ?? null,
        idea_quality_score: qualityScore,
        owner_id: body.ownerId || null,
        owner_name: body.ownerName || null,
        state: "idea_submitted",
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabaseAdmin.from("idea_state_events").insert({
      idea_id: data.id,
      from_state: null,
      to_state: "idea_submitted",
      action: "IDEA_CREATED",
      notes: "Initial idea submission",
      actor_id: body.ownerId || "system",
      actor_role: body.actorRole || "employee",
    })

    const attachments = Array.isArray(body.attachments) ? body.attachments : []
    if (attachments.length > 0) {
      const rows = attachments
        .filter(
          (item: { fileName?: string }) =>
            typeof item?.fileName === "string" && item.fileName.trim().length > 0
        )
        .slice(0, 5)
        .map(
          (item: {
            fileName?: string
            fileType?: string
            fileSize?: number
            fileData?: string
          }) => ({
            idea_id: data.id,
            file_name: String(item.fileName || "attachment"),
            file_type: item.fileType || null,
            file_size: Number.isFinite(Number(item.fileSize))
              ? Number(item.fileSize)
              : null,
            file_data:
              typeof item.fileData === "string" && item.fileData.length > 0
                ? item.fileData.slice(0, 2_000_000)
                : null,
          })
        )

      if (rows.length > 0) {
        await supabaseAdmin.from("idea_attachments").insert(rows)
      }
    }

    await logAudit({
      userId: body.ownerId || "system",
      action: "IDEA_CREATED",
      entity: "idea",
      entityId: data.id,
      metadata: {
        title: data.title,
        challengeId: data.challenge_id,
        teamId: data.team_id,
        maturityLevel: data.maturity_level,
        ideaQualityScore: data.idea_quality_score,
        attachmentsCount: attachments.length,
      },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 })
  }
}
