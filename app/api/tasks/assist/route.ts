import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const taskIds: string[] = Array.isArray(body.taskIds) ? body.taskIds : []

    let query = supabaseAdmin
      .from("tasks")
      .select("id,title,status,priority,progress,due_date,owner_name,blocked_reason,last_update")
      .order("created_at", { ascending: false })

    if (taskIds.length > 0) query = query.in("id", taskIds)

    const { data: tasks, error } = await query.limit(30)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = tasks || []
    const overdue = rows.filter((task) => task.due_date && task.status !== "done" && new Date(task.due_date) < new Date())
    const blocked = rows.filter((task) => task.status === "blocked")

    const suggestions = rows
      .slice(0, 5)
      .map((task) => `- ${task.title}: اقترح الخطوة التالية بناءً على الحالة (${task.status}) ونسبة التقدم ${task.progress}%`)

    const riskAlerts = [
      ...overdue.map((task) => `مهمة متأخرة: ${task.title}`),
      ...blocked.map((task) => `مهمة عالقة: ${task.title} (${task.blocked_reason || "بدون سبب"})`),
      ...rows.filter((task) => !task.owner_name).map((task) => `مهمة بلا مالك: ${task.title}`),
    ]

    const updateDraft = `تحديث تنفيذ اليوم: إجمالي ${rows.length} مهمة، المتأخر ${overdue.length}، العالق ${blocked.length}.`

    return NextResponse.json({
      data: {
        summary: `تحليل سريع لـ ${rows.length} مهمة تنفيذية`,
        suggestedActions: suggestions,
        riskAlerts,
        updateDraft,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to generate execution assistant output" }, { status: 500 })
  }
}
