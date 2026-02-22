import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

type TeamRow = {
  id: string
  name: string
  description: string | null
  objective: string | null
  challenge_id: string | null
  progress: number
  expected_impact: string | null
  achieved_impact: string | null
  created_at: string
  challenges?: { title: string | null } | Array<{ title: string | null }> | null
  team_members?: Array<{ id: string; member_name?: string; name?: string; role: string | null }>
}

type IdeaRow = {
  id: string
  team_id: string | null
  title: string
  state: string
  final_judging_score: number | null
}

type ProjectRow = {
  id: string
  idea_id: string
  name: string
  status: string
  progress: number
  pm_name: string | null
}

type TaskRow = {
  id: string
  team_id: string | null
  idea_id: string | null
  project_id: string | null
  title: string
  status: string
  due_date: string | null
  owner_name: string | null
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const challengeId = url.searchParams.get("challengeId")

  const buildQuery = (withMemberName: boolean) => {
    let query = supabaseAdmin
      .from("teams")
      .select(
        withMemberName
          ? "id,name,description,objective,challenge_id,progress,expected_impact,achieved_impact,created_at,challenges(title),team_members(id,member_name,role)"
          : "id,name,description,objective,challenge_id,progress,expected_impact,achieved_impact,created_at,challenges(title),team_members(id,name,role)"
      )
      .order("created_at", { ascending: false })

    if (challengeId) query = query.eq("challenge_id", challengeId)
    return query
  }

  let { data: teamsData, error: teamsError } = await buildQuery(true)
  if (teamsError && /team_members_\\d+\\.member_name|member_name/i.test(teamsError.message || "")) {
    const retry = await buildQuery(false)
    teamsData = retry.data
    teamsError = retry.error
  }

  if (teamsError) return NextResponse.json({ error: teamsError.message }, { status: 500 })

  const teams = ((teamsData || []) as TeamRow[]).map((team) => ({
    ...team,
    team_members: (team.team_members || []).map((member) => ({
      ...member,
      member_name: member.member_name || member.name || "",
    })),
  }))
  const teamIds = teams.map((team) => team.id)

  if (teamIds.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const [ideasRes, tasksRes] = await Promise.all([
    supabaseAdmin
      .from("ideas")
      .select("id,team_id,title,state,final_judging_score")
      .in("team_id", teamIds),
    supabaseAdmin
      .from("tasks")
      .select("id,team_id,idea_id,project_id,title,status,due_date,owner_name")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false }),
  ])

  if (ideasRes.error) return NextResponse.json({ error: ideasRes.error.message }, { status: 500 })
  if (tasksRes.error) return NextResponse.json({ error: tasksRes.error.message }, { status: 500 })

  const ideas = (ideasRes.data || []) as IdeaRow[]
  const tasks = (tasksRes.data || []) as TaskRow[]

  const ideaIds = ideas.map((idea) => idea.id)

  let projects: ProjectRow[] = []
  if (ideaIds.length > 0) {
    const projectsRes = await supabaseAdmin
      .from("projects")
      .select("id,idea_id,name,status,progress,pm_name")
      .in("idea_id", ideaIds)

    if (projectsRes.error) return NextResponse.json({ error: projectsRes.error.message }, { status: 500 })
    projects = (projectsRes.data || []) as ProjectRow[]
  }

  const ideasByTeam = new Map<string, IdeaRow[]>()
  ideas.forEach((idea) => {
    if (!idea.team_id) return
    const list = ideasByTeam.get(idea.team_id) || []
    list.push(idea)
    ideasByTeam.set(idea.team_id, list)
  })

  const tasksByTeam = new Map<string, TaskRow[]>()
  tasks.forEach((task) => {
    if (!task.team_id) return
    const list = tasksByTeam.get(task.team_id) || []
    list.push(task)
    tasksByTeam.set(task.team_id, list)
  })

  const projectsByIdea = new Map<string, ProjectRow[]>()
  projects.forEach((project) => {
    const list = projectsByIdea.get(project.idea_id) || []
    list.push(project)
    projectsByIdea.set(project.idea_id, list)
  })

  const data = teams.map((team) => {
    const teamIdeas = ideasByTeam.get(team.id) || []
    const teamTasks = tasksByTeam.get(team.id) || []
    const leader = (team.team_members || []).find(
      (member) => String(member.role || "").toLowerCase() === "leader"
    )

    const projectsForTeam = teamIdeas.flatMap((idea) => projectsByIdea.get(idea.id) || [])
    const tasksDone = teamTasks.filter((task) => task.status === "done").length
    const tasksProgress = teamTasks.length > 0 ? Math.round((tasksDone / teamTasks.length) * 100) : 0

    const challengeTitle = Array.isArray(team.challenges)
      ? team.challenges[0]?.title || null
      : team.challenges?.title || null

    return {
      ...team,
      challenge_title: challengeTitle,
      leader,
      ideas: teamIdeas,
      projects: projectsForTeam,
      tasks: teamTasks,
      tasks_progress: tasksProgress,
    }
  })

  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.name || !body.leaderName) {
      return NextResponse.json({ error: "name and leaderName are required" }, { status: 400 })
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .insert({
        name: body.name,
        description: body.description || null,
        objective: body.objective || null,
        challenge_id: body.challengeId || null,
        progress: Number(body.progress || 0),
        expected_impact: body.expectedImpact || null,
        achieved_impact: body.achievedImpact || null,
        updated_at: new Date().toISOString(),
      })
      .select("id,name,challenge_id")
      .single()

    if (teamError) return NextResponse.json({ error: teamError.message }, { status: 500 })

    const { error: leaderError } = await supabaseAdmin.from("team_members").insert({
      team_id: team.id,
      member_id: body.leaderId || null,
      member_name: body.leaderName,
      role: "leader",
    })

    if (leaderError) {
      await supabaseAdmin.from("teams").delete().eq("id", team.id)
      return NextResponse.json({ error: leaderError.message }, { status: 500 })
    }

    await logAudit({
      userId: body.actorId || "system",
      action: "TEAM_CREATED",
      entity: "team",
      entityId: team.id,
      metadata: {
        name: team.name,
        challengeId: team.challenge_id,
        leaderName: body.leaderName,
      },
    })

    return NextResponse.json({ data: team })
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

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) payload.name = body.name
    if (body.description !== undefined) payload.description = body.description
    if (body.objective !== undefined) payload.objective = body.objective
    if (body.challengeId !== undefined) payload.challenge_id = body.challengeId || null
    if (body.progress !== undefined) payload.progress = Number(body.progress)
    if (body.expectedImpact !== undefined) payload.expected_impact = body.expectedImpact || null
    if (body.achievedImpact !== undefined) payload.achieved_impact = body.achievedImpact || null

    const { data, error } = await supabaseAdmin
      .from("teams")
      .update(payload)
      .eq("id", body.id)
      .select("id,name,challenge_id,progress,expected_impact,achieved_impact")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "TEAM_UPDATED",
      entity: "team",
      entityId: body.id,
      metadata: {
        name: data.name,
        challengeId: data.challenge_id,
        progress: data.progress,
      },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 })
  }
}
