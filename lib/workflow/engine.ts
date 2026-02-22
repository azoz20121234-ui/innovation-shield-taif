import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"
import { canTransition } from "@/lib/workflow/stateMachine"

type TransitionParams = {
  ideaId: string
  toState: string
  actorId?: string
  actorRole?: string
  notes?: string
  action?: string
  autoCreateProject?: boolean
  pmName?: string
}

async function ensureExecutionProject(ideaId: string, ideaTitle: string, pmName?: string) {
  const { data: existing } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("idea_id", ideaId)
    .maybeSingle()

  if (existing?.id) return existing.id

  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 90)

  const { data: created, error } = await supabaseAdmin
    .from("projects")
    .insert({
      idea_id: ideaId,
      name: `مشروع تنفيذ - ${ideaTitle}`,
      description: "تم إنشاؤه تلقائيًا من الفكرة المقبولة ضمن خطة 90 يوم.",
      pm_name: pmName || "غير محدد",
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      status: "planned",
      progress: 0,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  const projectId = created.id

  await supabaseAdmin.from("tasks").insert([
    {
      project_id: projectId,
      idea_id: ideaId,
      title: "اعتماد نطاق التنفيذ وإطلاق الفريق",
      description: "تأكيد النطاق، الجدول، وآلية التقارير الأسبوعية.",
      status: "todo",
      due_date: start.toISOString().slice(0, 10),
    },
    {
      project_id: projectId,
      idea_id: ideaId,
      title: "تسليم النموذج التطبيقي الأول",
      description: "تحويل النموذج الأولي إلى نسخة تشغيلية تجريبية.",
      status: "todo",
      due_date: new Date(start.getTime() + 1000 * 60 * 60 * 24 * 30)
        .toISOString()
        .slice(0, 10),
    },
    {
      project_id: projectId,
      idea_id: ideaId,
      title: "قياس أثر منتصف المدة",
      description: "رفع تقرير منتصف التنفيذ ومقارنة baseline بالنتائج.",
      status: "todo",
      due_date: new Date(start.getTime() + 1000 * 60 * 60 * 24 * 60)
        .toISOString()
        .slice(0, 10),
    },
  ])

  await supabaseAdmin.from("project_risks").insert([
    {
      project_id: projectId,
      title: "تبني المستخدمين للحل الجديد",
      severity: "medium",
      mitigation: "تدريب مبكر وخطة تواصل داخلية",
    },
    {
      project_id: projectId,
      title: "تكامل الأنظمة",
      severity: "high",
      mitigation: "اختبارات تكامل مرحلية قبل الإطلاق",
    },
  ])

  await supabaseAdmin.from("project_kpis").insert([
    {
      project_id: projectId,
      name: "خفض زمن الإجراء",
      baseline: 100,
      target: 75,
      current_value: 100,
      unit: "%",
    },
    {
      project_id: projectId,
      name: "رضا المستخدم الداخلي",
      baseline: 60,
      target: 85,
      current_value: 60,
      unit: "%",
    },
  ])

  await logAudit({
    action: "PROJECT_AUTO_CREATED",
    entity: "project",
    entityId: projectId,
    metadata: { ideaId, planDays: 90 },
  })

  return projectId
}

export async function applyIdeaTransition(params: TransitionParams) {
  const { data: idea, error } = await supabaseAdmin
    .from("ideas")
    .select("id,title,state")
    .eq("id", params.ideaId)
    .single()

  if (error || !idea) throw new Error("Idea not found")

  const fromState = idea.state || "idea_submitted"
  if (!canTransition(fromState, params.toState)) {
    throw new Error(`Invalid transition from ${fromState} to ${params.toState}`)
  }

  const { error: updateError } = await supabaseAdmin
    .from("ideas")
    .update({ state: params.toState, updated_at: new Date().toISOString() })
    .eq("id", params.ideaId)

  if (updateError) throw new Error(updateError.message)

  await supabaseAdmin.from("idea_state_events").insert({
    idea_id: params.ideaId,
    from_state: fromState,
    to_state: params.toState,
    action: params.action || "STATE_TRANSITION",
    notes: params.notes || null,
    actor_id: params.actorId || "system",
    actor_role: params.actorRole || "system",
  })

  await logAudit({
    userId: params.actorId,
    action: params.action || "STATE_TRANSITION",
    entity: "idea",
    entityId: params.ideaId,
    metadata: {
      fromState,
      toState: params.toState,
      actorRole: params.actorRole || "system",
      notes: params.notes || null,
    },
  })

  let projectId: string | null = null
  if (params.autoCreateProject && params.toState === "approved_for_execution") {
    projectId = await ensureExecutionProject(params.ideaId, idea.title, params.pmName)
  }

  return { fromState, toState: params.toState, projectId }
}
