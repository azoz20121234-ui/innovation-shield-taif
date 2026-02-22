import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from("challenges")
      .insert({
        title: body.title,
        description: body.description || null,
        department: body.department || null,
        success_criteria: body.successCriteria || null,
        impact_metric: body.impactMetric || null,
        status: "open",
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "CHALLENGE_CREATED",
      entity: "challenge",
      entityId: data.id,
      metadata: { title: data.title },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 })
  }
}
