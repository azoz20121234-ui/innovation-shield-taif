import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*, tasks(*), project_risks(*), project_kpis(*), ideas(title,state)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    const { error } = await supabaseAdmin
      .from("projects")
      .update({
        status: body.status,
        progress: body.progress,
        pm_name: body.pmName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.projectId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "PROJECT_UPDATED",
      entity: "project",
      entityId: body.projectId,
      metadata: { status: body.status, progress: body.progress },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}
