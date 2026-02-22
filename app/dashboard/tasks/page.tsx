"use client"

import { useEffect, useMemo, useState } from "react"

type TaskStatus = "todo" | "inprogress" | "done"

type TaskRecord = {
  id: string
  title: string
  description: string | null
  owner_name: string | null
  due_date: string | null
  status: TaskStatus
  idea_id: string | null
  project_id: string | null
}

type IdeaOption = { id: string; title: string }
type ProjectOption = { id: string; name: string }

const columns: Array<{ key: TaskStatus; label: string }> = [
  { key: "todo", label: "To Do" },
  { key: "inprogress", label: "In Progress" },
  { key: "done", label: "Done" },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [ideas, setIdeas] = useState<IdeaOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState("")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [scopeFilter, setScopeFilter] = useState("all")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ownerName, setOwnerName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [ideaId, setIdeaId] = useState("")
  const [projectId, setProjectId] = useState("")

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const [tasksRes, ideasRes, projectsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/ideas"),
        fetch("/api/projects"),
      ])

      const tasksJson = await tasksRes.json()
      const ideasJson = await ideasRes.json()
      const projectsJson = await projectsRes.json()

      if (!tasksRes.ok) throw new Error(tasksJson.error || "تعذر تحميل المهام")
      if (!ideasRes.ok) throw new Error(ideasJson.error || "تعذر تحميل الأفكار")
      if (!projectsRes.ok) throw new Error(projectsJson.error || "تعذر تحميل المشاريع")

      setTasks(tasksJson.data || [])
      setIdeas((ideasJson.data || []).map((i: { id: string; title: string }) => ({ id: i.id, title: i.title })))
      setProjects((projectsJson.data || []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
    }, 30000)
    return () => clearInterval(timer)
  }, [])

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

  const ownerOptions = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.owner_name).filter(Boolean) as string[]))
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const value = search.trim().toLowerCase()

    return tasks.filter((task) => {
      if (ownerFilter !== "all" && (task.owner_name || "") !== ownerFilter) return false

      if (scopeFilter === "idea" && !task.idea_id) return false
      if (scopeFilter === "project" && !task.project_id) return false

      if (!value) return true

      const haystack = [
        task.title,
        task.description || "",
        task.owner_name || "",
        task.idea_id ? ideaName.get(task.idea_id) || "" : "",
        task.project_id ? projectName.get(task.project_id) || "" : "",
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(value)
    })
  }, [tasks, ownerFilter, scopeFilter, search, ideaName, projectName])

  const summary = useMemo(() => {
    const total = filteredTasks.length
    const done = filteredTasks.filter((t) => t.status === "done").length
    const overdue = filteredTasks.filter((t) => t.due_date && t.status !== "done" && new Date(t.due_date) < new Date()).length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0

    return { total, done, overdue, progress }
  }, [filteredTasks])

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
          status: "todo",
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
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const moveTask = async (task: TaskRecord) => {
    const next: TaskStatus =
      task.status === "todo" ? "inprogress" : task.status === "inprogress" ? "done" : "todo"

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: next,
          actorId: "pmo",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحديث المهمة")

      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  const renderColumn = (status: TaskStatus, label: string) => {
    const columnItems = filteredTasks.filter((task) => task.status === status)

    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{columnItems.length}</span>
        </div>

        <div className="space-y-2">
          {columnItems.map((task) => (
            <button
              key={task.id}
              onClick={() => moveTask(task)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-right transition hover:border-sky-500/60"
            >
              <p className="text-sm font-medium text-slate-100">{task.title}</p>
              {task.description && <p className="mt-1 text-xs text-slate-400">{task.description}</p>}
              <p className="mt-1 text-[11px] text-slate-500">
                فكرة: {task.idea_id ? ideaName.get(task.idea_id) || "-" : "-"} | مشروع: {task.project_id ? projectName.get(task.project_id) || "-" : "-"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                المالك: {task.owner_name || "غير محدد"} | الاستحقاق: {task.due_date || "-"}
              </p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">لوحة المهام التنفيذية</h1>
        <p className="mt-2 text-sm text-slate-300">
          لوحة تشغيلية مرتبطة بالأفكار والمشاريع، وكل تحديث يسجّل تلقائيًا في audit log.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">المهام بعد الفلترة</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">المكتملة</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.done}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">المتأخرة</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{summary.overdue}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">نسبة الإنجاز</p>
          <p className="mt-1 text-2xl font-semibold text-sky-300">{summary.progress}%</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="text-lg font-semibold text-slate-100">إضافة مهمة</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان المهمة"
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="اسم المسؤول"
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف المهمة"
            className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
          <select
            value={ideaId}
            onChange={(e) => setIdeaId(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          >
            <option value="">بدون ربط فكرة</option>
            {ideas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.title}
              </option>
            ))}
          </select>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          >
            <option value="">بدون ربط مشروع</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={createTask}
          disabled={saving}
          className="mt-4 rounded-2xl bg-sky-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "جارٍ الإضافة..." : "إضافة مهمة"}
        </button>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-4">
        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المهام"
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
          />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
          >
            <option value="all">كل المالكين</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
          >
            <option value="all">كل النطاقات</option>
            <option value="idea">مرتبطة بفكرة</option>
            <option value="project">مرتبطة بمشروع</option>
          </select>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-slate-300">جارٍ التحميل...</div>
        ) : (
          columns.map((col) => <div key={col.key}>{renderColumn(col.key, col.label)}</div>)
        )}
      </section>
    </div>
  )
}
