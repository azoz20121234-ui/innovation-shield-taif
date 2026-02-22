"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useDemoRole } from "@/lib/auth/useDemoRole"

type TeamMember = {
  id: string
  member_name: string
  role: string | null
}

type TeamIdea = {
  id: string
  title: string
  state: string
  final_judging_score: number | null
}

type TeamProject = {
  id: string
  idea_id: string
  name: string
  status: string
  progress: number
  pm_name: string | null
}

type TeamTask = {
  id: string
  title: string
  status: string
  due_date: string | null
  owner_name: string | null
  idea_id: string | null
  project_id: string | null
}

type TeamRecord = {
  id: string
  name: string
  description: string | null
  objective: string | null
  challenge_id: string | null
  challenge_title: string | null
  progress: number
  tasks_progress: number
  expected_impact: string | null
  achieved_impact: string | null
  leader?: TeamMember
  team_members?: TeamMember[]
  ideas?: TeamIdea[]
  projects?: TeamProject[]
  tasks?: TeamTask[]
}

type ChallengeOption = {
  id: string
  title: string
}

const stateLabels: Record<string, string> = {
  idea_submitted: "طرح الفكرة",
  ai_refined: "تحسين AI",
  team_formed: "تشكيل الفريق",
  prototype_ready: "نموذج أولي",
  ai_judged: "تحكيم AI",
  human_judged: "تحكيم بشري",
  approved_for_execution: "اعتماد التنفيذ",
  execution_in_progress: "تنفيذ",
  impact_tracking: "قياس أثر",
  protected_published: "حماية ونشر",
  rejected: "مرفوض",
}

export default function TeamsPage() {
  const { capabilities } = useDemoRole()
  const canManageExecution = capabilities.canManageExecution
  const [teams, setTeams] = useState<TeamRecord[]>([])
  const [challenges, setChallenges] = useState<ChallengeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [objective, setObjective] = useState("")
  const [challengeId, setChallengeId] = useState("")
  const [leaderName, setLeaderName] = useState("")
  const [expectedImpact, setExpectedImpact] = useState("")

  const [memberTeamId, setMemberTeamId] = useState("")
  const [memberName, setMemberName] = useState("")
  const [memberRole, setMemberRole] = useState("")

  const [taskTeamId, setTaskTeamId] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  const [taskOwner, setTaskOwner] = useState("")
  const [taskDueDate, setTaskDueDate] = useState("")

  const [ideaTeamId, setIdeaTeamId] = useState("")
  const [ideaTitle, setIdeaTitle] = useState("")
  const [ideaDescription, setIdeaDescription] = useState("")
  const [ideaChallengeId, setIdeaChallengeId] = useState("")

  const [progressEdit, setProgressEdit] = useState<Record<string, number>>({})
  const [achievedImpactEdit, setAchievedImpactEdit] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [teamsRes, challengesRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/challenges"),
      ])

      const teamsJson = await teamsRes.json()
      const challengesJson = await challengesRes.json()

      if (!teamsRes.ok) throw new Error(teamsJson.error || "تعذر تحميل الفرق")
      if (!challengesRes.ok) throw new Error(challengesJson.error || "تعذر تحميل التحديات")

      const rows = teamsJson.data || []
      setTeams(rows)
      setChallenges(challengesJson.data || [])

      if (!memberTeamId && rows[0]?.id) setMemberTeamId(rows[0].id)
      if (!taskTeamId && rows[0]?.id) setTaskTeamId(rows[0].id)
      if (!ideaTeamId && rows[0]?.id) setIdeaTeamId(rows[0].id)

      const progressSeed: Record<string, number> = {}
      const impactSeed: Record<string, string> = {}
      rows.forEach((team: TeamRecord) => {
        progressSeed[team.id] = team.progress || 0
        impactSeed[team.id] = team.achieved_impact || ""
      })
      setProgressEdit(progressSeed)
      setAchievedImpactEdit(impactSeed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }, [memberTeamId, taskTeamId, ideaTeamId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
    }, 30000)
    return () => clearInterval(timer)
  }, [load])

  const summary = useMemo(() => {
    const totalIdeas = teams.reduce((sum, team) => sum + (team.ideas?.length || 0), 0)
    const totalProjects = teams.reduce((sum, team) => sum + (team.projects?.length || 0), 0)
    const totalTasks = teams.reduce((sum, team) => sum + (team.tasks?.length || 0), 0)
    const avgProgress = teams.length > 0 ? Math.round(teams.reduce((sum, team) => sum + (team.progress || 0), 0) / teams.length) : 0

    return {
      teams: teams.length,
      totalIdeas,
      totalProjects,
      totalTasks,
      avgProgress,
    }
  }, [teams])

  const createTeam = async () => {
    if (!canManageExecution) return
    if (!name.trim() || !leaderName.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          objective,
          challengeId: challengeId || null,
          leaderName,
          expectedImpact,
          actorId: "innovation-office",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء الفريق")

      setName("")
      setDescription("")
      setObjective("")
      setChallengeId("")
      setLeaderName("")
      setExpectedImpact("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const addMember = async () => {
    if (!canManageExecution) return
    if (!memberTeamId || !memberName.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: memberTeamId,
          memberName,
          role: memberRole || "member",
          actorId: "team-leader",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إضافة العضو")

      setMemberName("")
      setMemberRole("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const removeMember = async (memberId: string) => {
    if (!canManageExecution) return
    try {
      const res = await fetch("/api/team-members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, actorId: "team-leader" }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر حذف العضو")

      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  const createTeamTask = async () => {
    if (!canManageExecution) return
    if (!taskTeamId || !taskTitle.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          ownerName: taskOwner || null,
          dueDate: taskDueDate || null,
          teamId: taskTeamId,
          status: "todo",
          actorId: "team-leader",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء مهمة الفريق")

      setTaskTitle("")
      setTaskOwner("")
      setTaskDueDate("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const submitTeamIdea = async () => {
    if (!canManageExecution) return
    if (!ideaTeamId || !ideaTitle.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: ideaTeamId,
          challengeId: ideaChallengeId || null,
          title: ideaTitle,
          description: ideaDescription,
          ownerId: "team-innovator",
          ownerName: "Team Innovator",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تقديم فكرة الفريق")

      setIdeaTitle("")
      setIdeaDescription("")
      setIdeaChallengeId("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const updateTeamProgress = async (team: TeamRecord) => {
    if (!canManageExecution) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: team.id,
          progress: progressEdit[team.id] ?? team.progress,
          achievedImpact: achievedImpactEdit[team.id] ?? team.achieved_impact,
          actorId: "team-leader",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحديث التقدم")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">وحدة إدارة الفرق الابتكارية</h1>
        <p className="mt-2 text-sm text-slate-300">
          تنظيم الفرق، حوكمة القائد الواحد، توزيع المهام، وربط الفريق بالأفكار والمشاريع مع تتبع كامل.
        </p>
      </section>
      {!canManageExecution && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          وضع القراءة فقط: إدارة الفرق والمهام متاحة لدور PMO أو الإدارة.
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">الفرق</p><p className="mt-1 text-2xl font-semibold text-slate-100">{summary.teams}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">الأفكار</p><p className="mt-1 text-2xl font-semibold text-sky-300">{summary.totalIdeas}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">المشاريع</p><p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.totalProjects}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">المهام</p><p className="mt-1 text-2xl font-semibold text-violet-300">{summary.totalTasks}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">متوسط التقدم</p><p className="mt-1 text-2xl font-semibold text-amber-300">{summary.avgProgress}%</p></div>
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="text-lg font-semibold text-slate-100">إنشاء فريق جديد</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الفريق" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
          <input value={leaderName} onChange={(e) => setLeaderName(e.target.value)} placeholder="اسم القائد (إلزامي)" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف مختصر" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
          <input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="الهدف أو المجال" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
          <select value={challengeId} onChange={(e) => setChallengeId(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
            <option value="">بدون ربط تحدي</option>
            {challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.title}</option>)}
          </select>
          <input value={expectedImpact} onChange={(e) => setExpectedImpact(e.target.value)} placeholder="الأثر المتوقع" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
        </div>
        <button onClick={createTeam} disabled={saving || !canManageExecution} className="mt-4 rounded-2xl bg-sky-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "جارٍ الإنشاء..." : "إنشاء الفريق"}
        </button>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
          <h2 className="text-lg font-semibold text-slate-100">إدارة الأعضاء</h2>
          <div className="mt-3 space-y-2">
            <select value={memberTeamId} onChange={(e) => setMemberTeamId(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
              <option value="">اختر الفريق</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="اسم العضو" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
            <input value={memberRole} onChange={(e) => setMemberRole(e.target.value)} placeholder="الدور (member/specialist)" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
            <button onClick={addMember} disabled={saving || !canManageExecution} className="w-full rounded-2xl bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50">إضافة عضو</button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
          <h2 className="text-lg font-semibold text-slate-100">توزيع مهام الفريق</h2>
          <div className="mt-3 space-y-2">
            <select value={taskTeamId} onChange={(e) => setTaskTeamId(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
              <option value="">اختر الفريق</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="عنوان المهمة" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
            <input value={taskOwner} onChange={(e) => setTaskOwner(e.target.value)} placeholder="المسؤول" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
            <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
            <button onClick={createTeamTask} disabled={saving || !canManageExecution} className="w-full rounded-2xl bg-sky-600 px-4 py-2 text-sm text-white disabled:opacity-50">إضافة المهمة</button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
          <h2 className="text-lg font-semibold text-slate-100">تقديم فكرة من الفريق</h2>
          <div className="mt-3 space-y-2">
            <select value={ideaTeamId} onChange={(e) => setIdeaTeamId(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
              <option value="">اختر الفريق</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
            <input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="عنوان الفكرة" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
            <textarea value={ideaDescription} onChange={(e) => setIdeaDescription(e.target.value)} placeholder="وصف الفكرة" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
            <select value={ideaChallengeId} onChange={(e) => setIdeaChallengeId(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
              <option value="">بدون تحدي</option>
              {challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.title}</option>)}
            </select>
            <button onClick={submitTeamIdea} disabled={saving || !canManageExecution} className="w-full rounded-2xl bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50">تقديم الفكرة</button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-300">جارٍ التحميل...</div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-300">لا توجد فرق بعد.</div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="rounded-3xl border border-slate-700 bg-slate-900/55 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-semibold text-slate-100">{team.name}</h3>
                  <p className="text-xs text-slate-400">التحدي المرتبط: {team.challenge_title || "غير مرتبط"}</p>
                </div>
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-300">{team.progress}%</span>
              </div>

              <p className="mt-2 text-sm text-slate-300">{team.description || "بدون وصف"}</p>
              <p className="mt-1 text-xs text-slate-400">الهدف/المجال: {team.objective || "غير محدد"}</p>
              <p className="mt-1 text-xs text-slate-400">القائد: {team.leader?.member_name || "غير محدد"}</p>
              <p className="mt-1 text-xs text-slate-400">الأثر المتوقع: {team.expected_impact || "غير محدد"}</p>
              <p className="mt-1 text-xs text-slate-400">الأثر المحقق: {team.achieved_impact || "غير مسجل"}</p>

              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                  <p className="text-slate-400">الأعضاء</p>
                  {(team.team_members || []).map((member) => (
                    <div key={member.id} className="mt-1 flex items-center justify-between gap-2">
                      <span>{member.member_name} ({member.role || "member"})</span>
                      <button disabled={!canManageExecution} onClick={() => removeMember(member.id)} className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-200 disabled:opacity-50">حذف</button>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                  <p className="text-slate-400">الأفكار</p>
                  {(team.ideas || []).length === 0 ? <p className="mt-1">لا يوجد</p> : (team.ideas || []).map((idea) => <p key={idea.id} className="mt-1">{idea.title} - {stateLabels[idea.state] || idea.state}</p>)}
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                  <p className="text-slate-400">المشاريع المرتبطة</p>
                  {(team.projects || []).length === 0 ? <p className="mt-1">لا يوجد</p> : (team.projects || []).map((project) => <p key={project.id} className="mt-1">{project.name} - {project.progress}%</p>)}
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                  <p className="text-slate-400">المهام الحالية</p>
                  {(team.tasks || []).length === 0 ? <p className="mt-1">لا يوجد</p> : (team.tasks || []).slice(0, 5).map((task) => <p key={task.id} className="mt-1">{task.title} - {task.status}</p>)}
                  <p className="mt-2 text-[11px] text-slate-400">تقدم المهام: {team.tasks_progress}%</p>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs text-slate-300">
                  <p className="text-slate-400">تحديث التقدم</p>
                  <input type="number" min={0} max={100} value={progressEdit[team.id] ?? team.progress} onChange={(e) => setProgressEdit((prev) => ({ ...prev, [team.id]: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-100" />
                  <textarea value={achievedImpactEdit[team.id] ?? team.achieved_impact ?? ""} onChange={(e) => setAchievedImpactEdit((prev) => ({ ...prev, [team.id]: e.target.value }))} placeholder="الأثر المحقق" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-100" rows={2} />
                  <button onClick={() => updateTeamProgress(team)} disabled={saving || !canManageExecution} className="mt-2 w-full rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white disabled:opacity-50">حفظ</button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
