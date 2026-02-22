"use client"

import { useEffect, useState } from "react"

type Task = {
  id: string
  title: string
  status: string
  due_date: string | null
}

type Risk = {
  id: string
  title: string
  severity: string
  status: string
}

type Kpi = {
  id: string
  name: string
  baseline: number | null
  target: number | null
  current_value: number | null
  unit: string | null
}

type Project = {
  id: string
  name: string
  description: string | null
  pm_name: string | null
  status: string
  progress: number
  start_date: string
  end_date: string
  tasks: Task[]
  project_risks: Risk[]
  project_kpis: Kpi[]
  ideas?: { title: string; state: string }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/projects")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحميل المشاريع")
      setProjects(json.data || [])
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

  const filteredProjects =
    statusFilter === "all"
      ? projects
      : projects.filter((project) => project.status === statusFilter)

  const updateProject = async (projectId: string, status: string, progress: number) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          status,
          progress,
          actorId: "pmo",
          pmName: "PMO Office",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحديث المشروع")

      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">مرحلة التنفيذ - PMO</h1>
        <p className="mt-2 text-sm text-slate-300">
          كل فكرة مقبولة تتحول تلقائيًا إلى مشروع 90 يوم مع مهام، مخاطر، وKPIs.
          كل تحديث يُسجل في audit log.
        </p>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-300">تصفية الحالة</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-sm text-slate-100"
          >
            <option value="all">كل المشاريع</option>
            <option value="planned">مخطط</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="monitoring">قياس أثر</option>
            <option value="completed">مكتمل</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-white/20 bg-slate-900/55 p-4 text-slate-300">جارٍ التحميل...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-white/20 bg-slate-900/55 p-4 text-slate-300">
            لا توجد مشاريع تنفيذ حتى الآن. اعتمد فكرة من صفحة التحكيم.
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">{project.name}</h2>
                  <p className="text-xs text-slate-400">
                    الفكرة: {project.ideas?.title || "-"} | الحالة: {project.ideas?.state || "-"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                  {project.progress}%
                </span>
              </div>

              <p className="text-sm text-slate-300">{project.description}</p>
              <p className="mt-2 text-xs text-slate-400">PM: {project.pm_name || "غير محدد"}</p>
              <p className="text-xs text-slate-400">المدة: {project.start_date} إلى {project.end_date}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => updateProject(project.id, "in_progress", 35)}
                  className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs text-white"
                >
                  بدء التنفيذ
                </button>
                <button
                  onClick={() => updateProject(project.id, "monitoring", 75)}
                  className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs text-white"
                >
                  انتقال لقياس الأثر
                </button>
                <button
                  onClick={() => updateProject(project.id, "completed", 100)}
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs text-white"
                >
                  إغلاق المشروع
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-100">المهام</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {project.tasks?.map((task) => (
                      <li key={task.id} className="rounded-xl bg-slate-950/70 px-2 py-2">
                        {task.title} - {task.status}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-100">المخاطر</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {project.project_risks?.map((risk) => (
                      <li key={risk.id} className="rounded-xl bg-slate-950/70 px-2 py-2">
                        {risk.title} - {risk.severity}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-slate-100">KPIs</h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {project.project_kpis?.map((kpi) => (
                      <li key={kpi.id} className="rounded-xl bg-slate-950/70 px-2 py-2">
                        {kpi.name}: {kpi.current_value ?? "-"}/{kpi.target ?? "-"} {kpi.unit || ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
