import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const state = url.searchParams.get("state")

  let query = supabaseAdmin
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false })

  if (state) query = query.eq("state", state)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from("ideas")
      .insert({
        challenge_id: body.challengeId || null,
        team_id: body.teamId || null,
        title: body.title,
        description: body.description || null,
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

    await logAudit({
      userId: body.ownerId || "system",
      action: "IDEA_CREATED",
      entity: "idea",
      entityId: data.id,
      metadata: { title: data.title, challengeId: data.challenge_id, teamId: data.team_id },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 })
  }
}
