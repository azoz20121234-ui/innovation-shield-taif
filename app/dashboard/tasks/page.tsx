"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type TaskStatus = "todo" | "inprogress" | "blocked" | "done"
type TaskPriority = "high" | "medium" | "low"

type TaskRecord = {
  id: string
  title: string
  description: string | null
  owner_name: string | null
  due_date: string | null
  status: TaskStatus
  idea_id: string | null
  project_id: string | null
  team_id: string | null
  priority: TaskPriority
  progress: number
  blocked_reason: string | null
  last_update: string | null
  last_activity_at: string | null
  created_at: string
}

type IdeaOption = { id: string; title: string; team_id?: string | null }
type ProjectOption = { id: string; name: string; idea_id?: string | null }
type TeamOption = { id: string; name: string }
type TaskComment = {
  id: string
  task_id: string
  author_name: string
  comment: string
  attachment_url: string | null
  created_at: string
}

const columns: Array<{ key: TaskStatus; label: string }> = [
  { key: "todo", label: "To Do" },
  { key: "inprogress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
]

const progressOptions = [0, 25, 50, 75, 100]

const priorityColor: Record<TaskPriority, string> = {
  high: "text-red-300",
  medium: "text-amber-300",
  low: "text-emerald-300",
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [ideas, setIdeas] = useState<IdeaOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantText, setAssistantText] = useState("")

  const [search, setSearch] = useState("")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [ideaFilter, setIdeaFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [teamFilter, setTeamFilter] = useState("all")
  const [dueFilter, setDueFilter] = useState("all")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [ideaId, setIdeaId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [teamId, setTeamId] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [progress, setProgress] = useState(0)
  const [blockedReason, setBlockedReason] = useState("")
  const [lastUpdate, setLastUpdate] = useState("")

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [commentText, setCommentText] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [commentAuthor, setCommentAuthor] = useState("PMO")

  const projectByIdea = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach((project) => {
      if (project.idea_id && !map.has(project.idea_id)) {
        map.set(project.idea_id, project.id)
      }
    })
    return map
  }, [projects])

  const ideaByProject = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach((project) => {
      if (project.idea_id) map.set(project.id, project.idea_id)
    })
    return map
  }, [projects])

  const recentIdeaByTeam = useMemo(() => {
    const map = new Map<string, string>()
    ideas.forEach((idea) => {
      if (idea.team_id && !map.has(idea.team_id)) {
        map.set(idea.team_id, idea.id)
      }
    })
    return map
  }, [ideas])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [tasksRes, ideasRes, projectsRes, teamsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/ideas"),
        fetch("/api/projects"),
        fetch("/api/teams"),
      ])

      const tasksJson = await tasksRes.json()
      const ideasJson = await ideasRes.json()
      const projectsJson = await projectsRes.json()
      const teamsJson = await teamsRes.json()

      if (!tasksRes.ok) throw new Error(tasksJson.error || "تعذر تحميل المهام")
      if (!ideasRes.ok) throw new Error(ideasJson.error || "تعذر تحميل الأفكار")
      if (!projectsRes.ok) throw new Error(projectsJson.error || "تعذر تحميل المشاريع")
      if (!teamsRes.ok) throw new Error(teamsJson.error || "تعذر تحميل الفرق")

      setTasks(tasksJson.data || [])
      setIdeas((ideasJson.data || []).map((i: { id: string; title: string; team_id?: string | null }) => ({ id: i.id, title: i.title, team_id: i.team_id || null })))
      setProjects((projectsJson.data || []).map((p: { id: string; name: string; idea_id?: string | null }) => ({ id: p.id, name: p.name, idea_id: p.idea_id || null })))
      setTeams((teamsJson.data || []).map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadComments = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/comments?taskId=${taskId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحميل التعليقات")
      setComments(json.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
      if (selectedTaskId) {
        void loadComments(selectedTaskId)
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [load, loadComments, selectedTaskId])

  const ideaName = useMemo(() => {
    const map = new Map<string, string>()
    ideas.forEach((idea) => map.set(idea.id, idea.title))
    return map
  }, [ideas])

  const projectName = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach((project) => map.set(project.id, project.name))
    return map
  }, [projects])

  const teamName = useMemo(() => {
    const map = new Map<string, string>()
    teams.forEach((team) => map.set(team.id, team.name))
    return map
  }, [teams])

  const ownerOptions = useMemo(() => Array.from(new Set(tasks.map((task) => task.owner_name).filter(Boolean) as string[])), [tasks])

  const filteredTasks = useMemo(() => {
    const value = search.trim().toLowerCase()
    const now = new Date()

    return tasks.filter((task) => {
      if (ownerFilter !== "all" && (task.owner_name || "") !== ownerFilter) return false
      if (statusFilter !== "all" && task.status !== statusFilter) return false
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false
      if (ideaFilter !== "all" && task.idea_id !== ideaFilter) return false
      if (projectFilter !== "all" && task.project_id !== projectFilter) return false
      if (teamFilter !== "all" && task.team_id !== teamFilter) return false

      if (dueFilter === "overdue" && (!task.due_date || new Date(task.due_date) >= now || task.status === "done")) return false
      if (dueFilter === "thisweek") {
        if (!task.due_date) return false
        const due = new Date(task.due_date)
        const diff = due.getTime() - now.getTime()
        if (diff < 0 || diff > 7 * 24 * 3600 * 1000) return false
      }
      if (dueFilter === "nodate" && task.due_date) return false

      if (!value) return true

      const haystack = [
        task.title,
        task.description || "",
        task.owner_name || "",
        task.idea_id ? ideaName.get(task.idea_id) || "" : "",
        task.project_id ? projectName.get(task.project_id) || "" : "",
        task.team_id ? teamName.get(task.team_id) || "" : "",
        task.last_update || "",
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(value)
    })
  }, [tasks, ownerFilter, statusFilter, priorityFilter, ideaFilter, projectFilter, teamFilter, dueFilter, search, ideaName, projectName, teamName])

  const alerts = useMemo(() => {
    const now = new Date()
    const oneDay = 24 * 3600 * 1000

    return {
      overdue: tasks.filter((task) => task.due_date && task.status !== "done" && new Date(task.due_date) < now).length,
      dueSoon: tasks.filter((task) => task.due_date && task.status !== "done" && new Date(task.due_date).getTime() - now.getTime() <= oneDay && new Date(task.due_date).getTime() >= now.getTime()).length,
      noOwner: tasks.filter((task) => !task.owner_name).length,
      noDate: tasks.filter((task) => !task.due_date).length,
      noUpdate: tasks.filter((task) => !task.last_activity_at || (now.getTime() - new Date(task.last_activity_at).getTime()) > 4 * oneDay).length,
      unlinked: tasks.filter((task) => !task.idea_id && !task.project_id).length,
    }
  }, [tasks])

  const summary = useMemo(() => {
    const total = filteredTasks.length
    const done = filteredTasks.filter((t) => t.status === "done").length
    const blocked = filteredTasks.filter((t) => t.status === "blocked").length
    const overdue = filteredTasks.filter((t) => t.due_date && t.status !== "done" && new Date(t.due_date) < new Date()).length
    const avgProgress = total > 0 ? Math.round(filteredTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / total) : 0

    return { total, done, blocked, overdue, avgProgress }
  }, [filteredTasks])

  const ownerLoad = useMemo(() => {
    const map = new Map<string, { count: number; blocked: number; high: number }>()
    tasks.forEach((task) => {
      const owner = task.owner_name || "غير معيّن"
      const row = map.get(owner) || { count: 0, blocked: 0, high: 0 }
      row.count += 1
      if (task.status === "blocked") row.blocked += 1
      if (task.priority === "high") row.high += 1
      map.set(owner, row)
    })

    return Array.from(map.entries())
      .map(([owner, value]) => ({ owner, ...value }))
      .sort((a, b) => b.count - a.count)
  }, [tasks])

  const timelineRows = useMemo(() => {
    if (tasks.length === 0) return []

    const starts = tasks.map((task) => new Date(task.created_at).getTime())
    const ends = tasks.map((task) => new Date(task.due_date || task.created_at).getTime())
    const min = Math.min(...starts)
    const max = Math.max(...ends, min + 24 * 3600 * 1000)
    const span = max - min

    return filteredTasks
      .slice(0, 14)
      .map((task) => {
        const start = new Date(task.created_at).getTime()
        const end = new Date(task.due_date || task.created_at).getTime()
        const left = ((start - min) / span) * 100
        const width = Math.max(((Math.max(end, start + 12 * 3600 * 1000) - start) / span) * 100, 2)
        return {
          task,
          left,
          width,
        }
      })
  }, [tasks, filteredTasks])

  const createTask = async () => {
    if (!title.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          ownerName,
          dueDate: dueDate || null,
          ideaId: ideaId || null,
          projectId: projectId || null,
          teamId: teamId || null,
          priority,
          progress,
          status,
          blockedReason: status === "blocked" ? blockedReason : null,
          lastUpdate: lastUpdate || null,
          actorId: "pmo",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء المهمة")

      setTitle("")
      setDescription("")
      setOwnerName("")
      setDueDate("")
      setIdeaId("")
      setProjectId("")
      setTeamId("")
      setPriority("medium")
      setStatus("todo")
      setProgress(0)
      setBlockedReason("")
      setLastUpdate("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const quickUpdateTask = async (task: TaskRecord, patch: Partial<TaskRecord> & { blockedReason?: string; lastUpdate?: string }) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: patch.status ?? task.status,
          priority: patch.priority ?? task.priority,
          progress: patch.progress ?? task.progress,
          ownerName: patch.owner_name ?? task.owner_name,
          dueDate: patch.due_date ?? task.due_date,
          ideaId: patch.idea_id ?? task.idea_id,
          projectId: patch.project_id ?? task.project_id,
          teamId: patch.team_id ?? task.team_id,
          blockedReason: patch.blockedReason,
          lastUpdate: patch.lastUpdate,
          actorId: "pmo",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحديث المهمة")

      await load()
      if (selectedTaskId === task.id) {
        await loadComments(task.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  const handleTeamChange = (value: string) => {
    setTeamId(value)
    if (!ideaId && value) {
      const suggestedIdea = recentIdeaByTeam.get(value)
      if (suggestedIdea) {
        setIdeaId(suggestedIdea)
        const suggestedProject = projectByIdea.get(suggestedIdea)
        if (suggestedProject) setProjectId(suggestedProject)
      }
    }
  }

  const handleIdeaChange = (value: string) => {
    setIdeaId(value)
    if (value) {
      const suggestedProject = projectByIdea.get(value)
      if (suggestedProject) {
        setProjectId(suggestedProject)
      }
      const idea = ideas.find((item) => item.id === value)
      if (idea?.team_id) {
        setTeamId(idea.team_id)
      }
    }
  }

  const handleProjectChange = (value: string) => {
    setProjectId(value)
    if (value) {
      const linkedIdeaId = ideaByProject.get(value)
      if (linkedIdeaId) {
        setIdeaId(linkedIdeaId)
        const linkedIdea = ideas.find((item) => item.id === linkedIdeaId)
        if (linkedIdea?.team_id) {
          setTeamId(linkedIdea.team_id)
        }
      }
    }
  }

  const runAssistant = async () => {
    setAssistantLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/tasks/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: filteredTasks.slice(0, 20).map((task) => task.id) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تشغيل مساعد التنفيذ")

      const data = json.data || {}
      const text = [
        data.summary || "",
        "",
        "إجراءات مقترحة:",
        ...(data.suggestedActions || []),
        "",
        "تنبيهات المخاطر:",
        ...(data.riskAlerts || []),
        "",
        `مسودة تحديث: ${data.updateDraft || "-"}`,
      ].join("\n")

      setAssistantText(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setAssistantLoading(false)
    }
  }

  const openTaskDetails = async (taskId: string) => {
    setSelectedTaskId(taskId)
    setCommentText("")
    setAttachmentUrl("")
    await loadComments(taskId)
  }

  const addComment = async () => {
    if (!selectedTaskId || !commentText.trim()) return

    setSaving(true)
    try {
      const res = await fetch("/api/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTaskId,
          comment: commentText,
          attachmentUrl: attachmentUrl || null,
          authorName: commentAuthor || "PMO",
          actorId: "pmo",
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إضافة التعليق")

      setCommentText("")
      setAttachmentUrl("")
      await loadComments(selectedTaskId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const renderColumn = (statusKey: TaskStatus, label: string) => {
    const columnItems = filteredTasks.filter((task) => task.status === statusKey)

    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{columnItems.length}</span>
        </div>

        <div className="space-y-3">
          {columnItems.map((task) => (
            <div key={task.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-100">{task.title}</p>
                <button onClick={() => void openTaskDetails(task.id)} className="rounded-lg border border-slate-600 px-2 py-1 text-[11px] text-slate-300">تفاصيل</button>
              </div>

              {task.description && <p className="mt-1 text-xs text-slate-400">{task.description}</p>}
              <p className="mt-1 text-[11px] text-slate-500">
                فكرة: {task.idea_id ? ideaName.get(task.idea_id) || "-" : "-"} | مشروع: {task.project_id ? projectName.get(task.project_id) || "-" : "-"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                فريق: {task.team_id ? teamName.get(task.team_id) || "-" : "-"} | المالك: {task.owner_name || "غير محدد"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                الاستحقاق: {task.due_date || "-"} | التقدم: {task.progress}% | <span className={priorityColor[task.priority]}>{task.priority.toUpperCase()}</span>
              </p>

              {task.status === "blocked" && (
                <p className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                  سبب التعليق: {task.blocked_reason || "غير محدد"}
                </p>
              )}

              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <select
                  value={task.status}
                  onChange={(e) => void quickUpdateTask(task, { status: e.target.value as TaskStatus })}
                  className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-slate-100"
                >
                  <option value="todo">todo</option>
                  <option value="inprogress">inprogress</option>
                  <option value="blocked">blocked</option>
                  <option value="done">done</option>
                </select>
                <select
                  value={task.priority}
                  onChange={(e) => void quickUpdateTask(task, { priority: e.target.value as TaskPriority })}
                  className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-slate-100"
                >
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
                <select
                  value={task.progress}
                  onChange={(e) => void quickUpdateTask(task, { progress: Number(e.target.value) })}
                  className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-slate-100"
                >
                  {progressOptions.map((option) => (
                    <option key={option} value={option}>{option}%</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">لوحة المهام التنفيذية (محسنة)</h1>
        <p className="mt-2 text-sm text-slate-300">حالات متقدمة، أولويات، تقدم تفصيلي، Mini‑Gantt، مساعد تنفيذ AI، وحوكمة بيانات كاملة.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">المهام بعد الفلترة</p><p className="mt-1 text-2xl font-semibold text-slate-100">{summary.total}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">المكتملة</p><p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.done}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">Blocked</p><p className="mt-1 text-2xl font-semibold text-amber-300">{summary.blocked}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">المتأخرة</p><p className="mt-1 text-2xl font-semibold text-red-300">{summary.overdue}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">متوسط الإنجاز</p><p className="mt-1 text-2xl font-semibold text-sky-300">{summary.avgProgress}%</p></div>
      </section>

      <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4">
        <h2 className="text-sm font-semibold text-red-100">تنبيهات ذكية</h2>
        <p className="mt-1 text-xs text-red-200">
          متأخرة: {alerts.overdue} | ستتأخر خلال 24 ساعة: {alerts.dueSoon} | بلا مالك: {alerts.noOwner} | بلا تاريخ: {alerts.noDate} | بلا تحديث: {alerts.noUpdate} | بلا ربط: {alerts.unlinked}
        </p>
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="text-lg font-semibold text-slate-100">إضافة مهمة</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المهمة" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
          <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="اسم المسؤول" className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف المهمة" className="md:col-span-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />

          <select value={teamId} onChange={(e) => handleTeamChange(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
            <option value="">اختر فريق (اختياري)</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <select value={ideaId} onChange={(e) => handleIdeaChange(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
            <option value="">فكرة (سيُربط تلقائيًا)</option>
            {ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.title}</option>)}
          </select>
          <select value={projectId} onChange={(e) => handleProjectChange(e.target.value)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
            <option value="">مشروع (سيُربط تلقائيًا)</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>

          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
          <select value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100">
            {progressOptions.map((option) => <option key={option} value={option}>{option}%</option>)}
          </select>

          {status === "blocked" && (
            <input value={blockedReason} onChange={(e) => setBlockedReason(e.target.value)} placeholder="سبب التعليق" className="md:col-span-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-amber-100" />
          )}

          <input value={lastUpdate} onChange={(e) => setLastUpdate(e.target.value)} placeholder="آخر تحديث تنفيذي" className="md:col-span-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100" />
        </div>

        <button onClick={createTask} disabled={saving} className="mt-4 rounded-2xl bg-sky-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
          {saving ? "جارٍ الإضافة..." : "إضافة مهمة"}
        </button>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-4">
        <div className="grid gap-2 md:grid-cols-5 xl:grid-cols-10">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث" className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100" />
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">المالك</option>{ownerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}</select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">الحالة</option><option value="todo">todo</option><option value="inprogress">inprogress</option><option value="blocked">blocked</option><option value="done">done</option></select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">الأولوية</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select>
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">الفريق</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
          <select value={ideaFilter} onChange={(e) => setIdeaFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">الفكرة</option>{ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.title}</option>)}</select>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">المشروع</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
          <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"><option value="all">الاستحقاق</option><option value="overdue">متأخر</option><option value="thisweek">خلال 7 أيام</option><option value="nodate">بدون تاريخ</option></select>
          <button onClick={() => void runAssistant()} className="rounded-xl border border-violet-500/40 bg-violet-500/15 p-2 text-xs text-violet-200">{assistantLoading ? "AI..." : "مساعد تنفيذ AI"}</button>
          <button onClick={() => { setSearch(""); setOwnerFilter("all"); setStatusFilter("all"); setPriorityFilter("all"); setIdeaFilter("all"); setProjectFilter("all"); setTeamFilter("all"); setDueFilter("all") }} className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-slate-200">إعادة ضبط</button>
        </div>
      </section>

      {assistantText && (
        <section className="rounded-3xl border border-violet-500/30 bg-violet-500/10 p-4">
          <pre className="whitespace-pre-wrap text-xs text-violet-100">{assistantText}</pre>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/20 bg-slate-900/55 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Mini‑Gantt Timeline</h2>
          <div className="mt-3 space-y-2">
            {timelineRows.map(({ task, left, width }) => (
              <div key={task.id}>
                <p className="mb-1 text-xs text-slate-300">{task.title}</p>
                <div className="h-3 rounded-full bg-slate-800">
                  <div
                    style={{ marginRight: `${left}%`, width: `${width}%` }}
                    className={`h-3 rounded-full ${task.status === "done" ? "bg-emerald-500" : task.status === "blocked" ? "bg-amber-500" : "bg-sky-500"}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/20 bg-slate-900/55 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Owner Load Indicator</h2>
          <div className="mt-3 space-y-2">
            {ownerLoad.map((row) => {
              const maxCount = Math.max(...ownerLoad.map((item) => item.count), 1)
              const width = (row.count / maxCount) * 100
              return (
                <div key={row.owner}>
                  <p className="text-xs text-slate-300">{row.owner}: {row.count} مهام (High: {row.high}, Blocked: {row.blocked})</p>
                  <div className="h-2 rounded-full bg-slate-800"><div style={{ width: `${width}%` }} className="h-2 rounded-full bg-cyan-500" /></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-slate-300">جارٍ التحميل...</div>
        ) : (
          columns.map((col) => <div key={col.key}>{renderColumn(col.key, col.label)}</div>)
        )}
      </section>

      {selectedTaskId && (
        <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
          <h2 className="text-lg font-semibold text-slate-100">تعليقات ومرفقات المهمة</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input value={commentAuthor} onChange={(e) => setCommentAuthor(e.target.value)} placeholder="اسم المعلّق" className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100" />
            <input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="رابط المرفق (اختياري)" className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100" />
            <button onClick={addComment} disabled={saving} className="rounded-xl bg-sky-600 p-2 text-sm text-white disabled:opacity-50">إضافة تعليق</button>
          </div>
          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="نص التعليق" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-100" rows={3} />

          <div className="mt-4 space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-xs text-slate-300">{comment.author_name} - {new Date(comment.created_at).toLocaleString("ar-SA")}</p>
                <p className="mt-1 text-sm text-slate-100">{comment.comment}</p>
                {comment.attachment_url && (
                  <a href={comment.attachment_url} target="_blank" className="mt-1 inline-block text-xs text-cyan-300 underline" rel="noreferrer">
                    فتح المرفق
                  </a>
                )}
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-slate-400">لا توجد تعليقات بعد.</p>}
          </div>
        </section>
      )}
    </div>
  )
}
