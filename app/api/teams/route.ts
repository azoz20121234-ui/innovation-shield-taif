import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const ideaId = url.searchParams.get("ideaId")

  let query = supabaseAdmin
    .from("teams")
    .select("id,name,idea_id,created_at,team_members(id,member_name,role)")
    .order("created_at", { ascending: false })

  if (ideaId) query = query.eq("idea_id", ideaId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("teams")
      .insert({
        name: body.name,
        idea_id: body.ideaId || null,
      })
      .select("id,name,idea_id,created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "TEAM_CREATED",
      entity: "team",
      entityId: data.id,
      metadata: { name: data.name, ideaId: data.idea_id },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const payload: Record<string, unknown> = {}
    if (body.name !== undefined) payload.name = body.name
    if (body.ideaId !== undefined) payload.idea_id = body.ideaId || null

    const { data, error } = await supabaseAdmin
      .from("teams")
      .update(payload)
      .eq("id", body.id)
      .select("id,name,idea_id")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "TEAM_UPDATED",
      entity: "team",
      entityId: body.id,
      metadata: { name: data.name, ideaId: data.idea_id },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}
