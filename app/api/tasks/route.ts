import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

type TaskStatus = "todo" | "inprogress" | "blocked" | "done"
type TaskPriority = "high" | "medium" | "low"

async function resolveTaskLinks(input: {
  ideaId?: string | null
  projectId?: string | null
  teamId?: string | null
}) {
  let ideaId = input.ideaId || null
  let projectId = input.projectId || null
  let teamId = input.teamId || null

  if (projectId && !ideaId) {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("idea_id")
      .eq("id", projectId)
      .maybeSingle()
    ideaId = project?.idea_id || null
  }

  if (ideaId && !projectId) {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    projectId = project?.id || null
  }

  if (!ideaId && !projectId && teamId) {
    const { data: teamIdea } = await supabaseAdmin
      .from("ideas")
      .select("id")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (teamIdea?.id) {
      ideaId = teamIdea.id
      const { data: project } = await supabaseAdmin
        .from("projects")
        .select("id")
        .eq("idea_id", teamIdea.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      projectId = project?.id || null
    }
  }

  if (!ideaId && !projectId) {
    throw new Error("يجب ربط المهمة بفكرة أو مشروع (مباشرة أو عبر الفريق)")
  }

  if (ideaId && projectId) {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("idea_id")
      .eq("id", projectId)
      .maybeSingle()

    if (project?.idea_id && project.idea_id !== ideaId) {
      throw new Error("المشروع المحدد لا يتبع الفكرة المختارة")
    }
  }

  if (ideaId && !teamId) {
    const { data: idea } = await supabaseAdmin
      .from("ideas")
      .select("team_id")
      .eq("id", ideaId)
      .maybeSingle()
    teamId = idea?.team_id || null
  }

  return { ideaId, projectId, teamId }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const ideaId = url.searchParams.get("ideaId")
  const projectId = url.searchParams.get("projectId")
  const teamId = url.searchParams.get("teamId")
  const status = url.searchParams.get("status")
  const priority = url.searchParams.get("priority")
  const owner = url.searchParams.get("owner")
  const unassigned = url.searchParams.get("unassigned")
  const missingDueDate = url.searchParams.get("missingDueDate")

  let query = supabaseAdmin
    .from("tasks")
    .select("id,title,description,owner_name,status,due_date,idea_id,project_id,team_id,priority,progress,blocked_reason,last_update,last_activity_at,created_at,updated_at")
    .order("created_at", { ascending: false })

  if (ideaId) query = query.eq("idea_id", ideaId)
  if (projectId) query = query.eq("project_id", projectId)
  if (teamId) query = query.eq("team_id", teamId)
  if (status) query = query.eq("status", status)
  if (priority) query = query.eq("priority", priority)
  if (owner) query = query.eq("owner_name", owner)
  if (unassigned === "true") query = query.is("owner_name", null)
  if (missingDueDate === "true") query = query.is("due_date", null)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const links = await resolveTaskLinks({
      ideaId: body.ideaId,
      projectId: body.projectId,
      teamId: body.teamId,
    })

    const incomingStatus = (body.status as TaskStatus) || "todo"
    const incomingProgress = Number(body.progress ?? (incomingStatus === "done" ? 100 : 0))

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        title: body.title,
        description: body.description || null,
        owner_name: body.ownerName || null,
        due_date: body.dueDate || null,
        status: incomingStatus,
        idea_id: links.ideaId,
        project_id: links.projectId,
        team_id: links.teamId,
        priority: (body.priority as TaskPriority) || "medium",
        progress: Math.max(0, Math.min(100, incomingProgress)),
        blocked_reason: incomingStatus === "blocked" ? body.blockedReason || "Waiting dependency" : null,
        last_update: body.lastUpdate || null,
        last_activity_at: new Date().toISOString(),
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
        priority: data.priority,
        progress: data.progress,
      },
    })

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create task" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    if (!body.id) {
      return NextResponse.json({ error: "Task id is required" }, { status: 400 })
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("tasks")
      .select("id,idea_id,project_id,team_id,status,progress,blocked_reason")
      .eq("id", body.id)
      .single()

    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })

    const links = await resolveTaskLinks({
      ideaId: body.ideaId ?? existing.idea_id,
      projectId: body.projectId ?? existing.project_id,
      teamId: body.teamId ?? existing.team_id,
    })

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      idea_id: links.ideaId,
      project_id: links.projectId,
      team_id: links.teamId,
    }

    if (body.title !== undefined) payload.title = body.title
    if (body.description !== undefined) payload.description = body.description
    if (body.ownerName !== undefined) payload.owner_name = body.ownerName
    if (body.dueDate !== undefined) payload.due_date = body.dueDate
    if (body.status !== undefined) payload.status = body.status
    if (body.priority !== undefined) payload.priority = body.priority
    if (body.progress !== undefined) payload.progress = Math.max(0, Math.min(100, Number(body.progress)))
    if (body.lastUpdate !== undefined) payload.last_update = body.lastUpdate

    const nextStatus = (body.status as TaskStatus | undefined) || (existing.status as TaskStatus)
    if (nextStatus === "done" && body.progress === undefined) payload.progress = 100

    if (nextStatus === "blocked") {
      payload.blocked_reason = body.blockedReason || existing.blocked_reason || "Waiting dependency"
    } else {
      payload.blocked_reason = null
    }

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
        priority: data.priority,
        progress: data.progress,
      },
    })

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update task" }, { status: 500 })
  }
}
