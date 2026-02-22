import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

type TaskStatus = "todo" | "inprogress" | "done"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const ideaId = url.searchParams.get("ideaId")
  const projectId = url.searchParams.get("projectId")
  const teamId = url.searchParams.get("teamId")
  const status = url.searchParams.get("status")

  let query = supabaseAdmin
    .from("tasks")
    .select("id,title,description,owner_name,status,due_date,idea_id,project_id,team_id,created_at,updated_at")
    .order("created_at", { ascending: false })

  if (ideaId) query = query.eq("idea_id", ideaId)
  if (projectId) query = query.eq("project_id", projectId)
  if (teamId) query = query.eq("team_id", teamId)
  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        title: body.title,
        description: body.description || null,
        owner_name: body.ownerName || null,
        due_date: body.dueDate || null,
        status: (body.status as TaskStatus) || "todo",
        idea_id: body.ideaId || null,
        project_id: body.projectId || null,
        team_id: body.teamId || null,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "TASK_CREATED",
      entity: "task",
      entityId: data.id,
      metadata: {
        title: data.title,
        ideaId: data.idea_id,
        projectId: data.project_id,
        teamId: data.team_id,
      },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    if (!body.id) {
      return NextResponse.json({ error: "Task id is required" }, { status: 400 })
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) payload.title = body.title
    if (body.description !== undefined) payload.description = body.description
    if (body.ownerName !== undefined) payload.owner_name = body.ownerName
    if (body.dueDate !== undefined) payload.due_date = body.dueDate
    if (body.status !== undefined) payload.status = body.status
    if (body.teamId !== undefined) payload.team_id = body.teamId

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update(payload)
      .eq("id", body.id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "TASK_UPDATED",
      entity: "task",
      entityId: body.id,
      metadata: {
        status: data.status,
        title: data.title,
        teamId: data.team_id,
      },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
