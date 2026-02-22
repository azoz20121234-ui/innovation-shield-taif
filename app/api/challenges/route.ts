import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

type ChallengeRow = {
  id: string
  title: string
  description: string | null
  department: string | null
  innovation_track: string | null
  challenge_owner: string | null
  baseline_value: string | null
  target_value: string | null
  scope_in: string | null
  scope_out: string | null
  execution_constraints: string | null
  success_criteria: string | null
  impact_metric: string | null
  status: string
  lifecycle_status: "draft" | "open" | "in_review" | "closed" | "archived"
  target_ideas: number
  start_date: string | null
  end_date: string | null
  created_at: string
}

type IdeaRow = {
  id: string
  challenge_id: string | null
  state: string
}

type ProjectRow = {
  id: string
  idea_id: string
  progress: number
  status: string
}

const acceptedIdeaStates = new Set([
  "human_judged",
  "approved_for_execution",
  "execution_in_progress",
  "impact_tracking",
  "protected_published",
])

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function scoreChallenge(params: {
  ideasCount: number
  acceptedCount: number
  projectsCount: number
  progressRate: number
}) {
  const ideasPart = Math.min(params.ideasCount * 8, 24)
  const acceptedPart = Math.min(params.acceptedCount * 15, 30)
  const projectsPart = Math.min(params.projectsCount * 20, 30)
  const progressPart = Math.round(params.progressRate * 0.16)

  const score = clamp(ideasPart + acceptedPart + projectsPart + progressPart, 0, 100)

  if (score >= 70) {
    return {
      score,
      level: "effective",
      recommendation: "التحدي فعّال، استمر بالتوسعة وربط نتائج التنفيذ بالتأثير.",
    }
  }

  if (score >= 40) {
    return {
      score,
      level: "average",
      recommendation: "التحدي متوسط، يحتاج دعم في جودة الأفكار أو سرعة التحويل لمشاريع.",
    }
  }

  return {
    score,
    level: "weak",
    recommendation: "التحدي ضعيف ويحتاج إعادة صياغة نطاق المشكلة ومعايير النجاح.",
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const lifecycle = url.searchParams.get("lifecycle")
  const department = url.searchParams.get("department")
  const track = url.searchParams.get("track")

  let query = supabaseAdmin
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false })

  if (lifecycle && lifecycle !== "all") query = query.eq("lifecycle_status", lifecycle)
  if (department && department !== "all") query = query.eq("department", department)
  if (track && track !== "all") query = query.eq("innovation_track", track)

  const { data: challengesData, error: challengesError } = await query
  if (challengesError) return NextResponse.json({ error: challengesError.message }, { status: 500 })

  const challenges = (challengesData || []) as ChallengeRow[]
  const challengeIds = challenges.map((challenge) => challenge.id)

  if (challengeIds.length === 0) {
    return NextResponse.json({
      data: [],
      dashboard: {
        mostParticipatingDepartments: [],
        mostAttractiveChallenges: [],
        needsExtension: [],
        noIdeas: [],
        effectivenessSummary: { effective: 0, average: 0, weak: 0 },
      },
    })
  }

  const { data: ideasData, error: ideasError } = await supabaseAdmin
    .from("ideas")
    .select("id,challenge_id,state")
    .in("challenge_id", challengeIds)

  if (ideasError) return NextResponse.json({ error: ideasError.message }, { status: 500 })

  const ideas = (ideasData || []) as IdeaRow[]
  const ideaIds = ideas.map((idea) => idea.id)

  let projects: ProjectRow[] = []
  if (ideaIds.length > 0) {
    const { data: projectsData, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select("id,idea_id,progress,status")
      .in("idea_id", ideaIds)

    if (projectsError) return NextResponse.json({ error: projectsError.message }, { status: 500 })
    projects = (projectsData || []) as ProjectRow[]
  }

  const challengeIdeas = new Map<string, IdeaRow[]>()
  ideas.forEach((idea) => {
    if (!idea.challenge_id) return
    const list = challengeIdeas.get(idea.challenge_id) || []
    list.push(idea)
    challengeIdeas.set(idea.challenge_id, list)
  })

  const projectsByIdea = new Map<string, ProjectRow[]>()
  projects.forEach((project) => {
    const list = projectsByIdea.get(project.idea_id) || []
    list.push(project)
    projectsByIdea.set(project.idea_id, list)
  })

  const today = new Date()

  const enriched = challenges.map((challenge) => {
    const linkedIdeas = challengeIdeas.get(challenge.id) || []
    const acceptedIdeas = linkedIdeas.filter((idea) => acceptedIdeaStates.has(idea.state)).length

    const linkedProjects = linkedIdeas.flatMap((idea) => projectsByIdea.get(idea.id) || [])
    const avgProjectProgress =
      linkedProjects.length > 0
        ? Math.round(linkedProjects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / linkedProjects.length)
        : 0

    const progressRate =
      challenge.target_ideas > 0
        ? clamp(Math.round((acceptedIdeas / challenge.target_ideas) * 100), 0, 100)
        : avgProjectProgress

    const endDate = challenge.end_date ? new Date(challenge.end_date) : null
    const needsExtension =
      Boolean(endDate) &&
      endDate!.getTime() < today.getTime() &&
      ["open", "in_review"].includes(challenge.lifecycle_status) &&
      acceptedIdeas < challenge.target_ideas

    const effectiveness = scoreChallenge({
      ideasCount: linkedIdeas.length,
      acceptedCount: acceptedIdeas,
      projectsCount: linkedProjects.length,
      progressRate,
    })

    return {
      ...challenge,
      metrics: {
        ideasCount: linkedIdeas.length,
        acceptedIdeas,
        projectsCount: linkedProjects.length,
        progressRate,
        avgProjectProgress,
        needsExtension,
      },
      effectiveness,
    }
  })

  const byDepartment = new Map<string, { department: string; ideas: number; challenges: number }>()
  enriched.forEach((challenge) => {
    const dept = challenge.department || "غير مصنف"
    const row = byDepartment.get(dept) || { department: dept, ideas: 0, challenges: 0 }
    row.ideas += challenge.metrics.ideasCount
    row.challenges += 1
    byDepartment.set(dept, row)
  })

  const mostParticipatingDepartments = Array.from(byDepartment.values())
    .sort((a, b) => b.ideas - a.ideas)
    .slice(0, 5)

  const mostAttractiveChallenges = enriched
    .slice()
    .sort((a, b) => b.metrics.ideasCount - a.metrics.ideasCount)
    .slice(0, 5)
    .map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      department: challenge.department,
      ideasCount: challenge.metrics.ideasCount,
    }))

  const needsExtension = enriched
    .filter((challenge) => challenge.metrics.needsExtension)
    .map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      endDate: challenge.end_date,
      acceptedIdeas: challenge.metrics.acceptedIdeas,
      targetIdeas: challenge.target_ideas,
    }))

  const noIdeas = enriched
    .filter((challenge) => challenge.metrics.ideasCount === 0 && ["open", "in_review"].includes(challenge.lifecycle_status))
    .map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      department: challenge.department,
    }))

  const effectivenessSummary = enriched.reduce(
    (acc, challenge) => {
      if (challenge.effectiveness.level === "effective") acc.effective += 1
      else if (challenge.effectiveness.level === "average") acc.average += 1
      else acc.weak += 1
      return acc
    },
    { effective: 0, average: 0, weak: 0 }
  )

  return NextResponse.json({
    data: enriched,
    dashboard: {
      mostParticipatingDepartments,
      mostAttractiveChallenges,
      needsExtension,
      noIdeas,
      effectivenessSummary,
    },
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const lifecycleStatus = (body.lifecycleStatus || "draft") as string

    const { data, error } = await supabaseAdmin
      .from("challenges")
      .insert({
        title: body.title,
        description: body.description || null,
        department: body.department || null,
        innovation_track: body.innovationTrack || null,
        challenge_owner: body.challengeOwner || null,
        baseline_value: body.baselineValue || null,
        target_value: body.targetValue || null,
        scope_in: body.scopeIn || null,
        scope_out: body.scopeOut || null,
        execution_constraints: body.executionConstraints || null,
        success_criteria: body.successCriteria || null,
        impact_metric: body.impactMetric || null,
        status: lifecycleStatus === "closed" ? "closed" : "open",
        lifecycle_status: lifecycleStatus,
        target_ideas: Number(body.targetIdeas || 5),
        start_date: body.startDate || new Date().toISOString().slice(0, 10),
        end_date: body.endDate || null,
        opened_at: lifecycleStatus === "open" ? new Date().toISOString() : null,
      })
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "CHALLENGE_CREATED",
      entity: "challenge",
      entityId: data.id,
      metadata: {
        title: data.title,
        track: data.innovation_track,
        lifecycleStatus: data.lifecycle_status,
        targetIdeas: data.target_ideas,
      },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { data: current, error: currentError } = await supabaseAdmin
      .from("challenges")
      .select("id,lifecycle_status")
      .eq("id", body.id)
      .single()

    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 500 })

    const nextLifecycle = body.lifecycleStatus ?? current.lifecycle_status

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) payload.title = body.title
    if (body.description !== undefined) payload.description = body.description
    if (body.department !== undefined) payload.department = body.department
    if (body.innovationTrack !== undefined) payload.innovation_track = body.innovationTrack
    if (body.challengeOwner !== undefined) payload.challenge_owner = body.challengeOwner
    if (body.baselineValue !== undefined) payload.baseline_value = body.baselineValue
    if (body.targetValue !== undefined) payload.target_value = body.targetValue
    if (body.scopeIn !== undefined) payload.scope_in = body.scopeIn
    if (body.scopeOut !== undefined) payload.scope_out = body.scopeOut
    if (body.executionConstraints !== undefined) payload.execution_constraints = body.executionConstraints
    if (body.successCriteria !== undefined) payload.success_criteria = body.successCriteria
    if (body.impactMetric !== undefined) payload.impact_metric = body.impactMetric
    if (body.targetIdeas !== undefined) payload.target_ideas = Number(body.targetIdeas)
    if (body.startDate !== undefined) payload.start_date = body.startDate
    if (body.endDate !== undefined) payload.end_date = body.endDate
    if (body.status !== undefined) payload.status = body.status

    if (body.lifecycleStatus !== undefined) {
      payload.lifecycle_status = body.lifecycleStatus
      payload.status = body.lifecycleStatus === "closed" ? "closed" : "open"

      if (body.lifecycleStatus === "open" && current.lifecycle_status !== "open") {
        payload.opened_at = new Date().toISOString()
      }
      if (body.lifecycleStatus === "in_review" && current.lifecycle_status !== "in_review") {
        payload.review_started_at = new Date().toISOString()
      }
      if (body.lifecycleStatus === "closed" && current.lifecycle_status !== "closed") {
        payload.closed_at = new Date().toISOString()
      }
      if (body.lifecycleStatus === "archived" && current.lifecycle_status !== "archived") {
        payload.archived_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabaseAdmin
      .from("challenges")
      .update(payload)
      .eq("id", body.id)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "CHALLENGE_UPDATED",
      entity: "challenge",
      entityId: body.id,
      metadata: {
        status: data.status,
        lifecycleStatus: nextLifecycle,
        title: data.title,
      },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 })
  }
}
