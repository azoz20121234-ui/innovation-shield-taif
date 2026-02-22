import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const taskId = url.searchParams.get("taskId")

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("task_comments")
    .select("id,task_id,author_name,comment,attachment_url,created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data || [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.taskId || !body.comment || !body.authorName) {
      return NextResponse.json({ error: "taskId, comment and authorName are required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("task_comments")
      .insert({
        task_id: body.taskId,
        author_name: body.authorName,
        comment: body.comment,
        attachment_url: body.attachmentUrl || null,
      })
      .select("id,task_id,author_name,comment,attachment_url,created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabaseAdmin
      .from("tasks")
      .update({
        last_update: body.comment,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.taskId)

    await logAudit({
      userId: body.actorId || body.authorName,
      action: "TASK_COMMENT_ADDED",
      entity: "task",
      entityId: body.taskId,
      metadata: {
        hasAttachment: Boolean(body.attachmentUrl),
      },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
