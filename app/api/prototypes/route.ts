import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

const prototypeStates = ["ai_refined", "team_formed", "prototype_ready"]

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("ideas")
    .select("id,title,description,state,ai_prototype_hint,updated_at")
    .in("state", prototypeStates)
    .order("updated_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    if (!body.ideaId) {
      return NextResponse.json({ error: "ideaId is required" }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.prototypeHint !== undefined) {
      updates.ai_prototype_hint = body.prototypeHint || null
    }

    if (body.state !== undefined) {
      updates.state = body.state
    }

    const { data, error } = await supabaseAdmin
      .from("ideas")
      .update(updates)
      .eq("id", body.ideaId)
      .select("id,title,state,ai_prototype_hint,updated_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "PROTOTYPE_UPDATED",
      entity: "idea",
      entityId: body.ideaId,
      metadata: {
        state: data.state,
        hasPrototypeHint: Boolean(data.ai_prototype_hint),
      },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to update prototype" }, { status: 500 })
  }
}
