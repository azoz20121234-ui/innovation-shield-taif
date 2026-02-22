"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useDemoRole } from "@/lib/auth/useDemoRole"

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
  idea_id: string
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

type Team = {
  id: string
  name: string
  progress: number
  ideas?: Array<{ id: string }>
}

export default function ProjectsPage() {
  const { capabilities } = useDemoRole()
  const canManageExecution = capabilities.canManageExecution
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [projectsRes, teamsRes] = await Promise.all([fetch("/api/projects"), fetch("/api/teams")])
      const projectsJson = await projectsRes.json()
      const teamsJson = await teamsRes.json()

      if (!projectsRes.ok) throw new Error(projectsJson.error || "تعذر تحميل المشاريع")
      if (!teamsRes.ok) throw new Error(teamsJson.error || "تعذر تحميل الفرق")

      setProjects(projectsJson.data || [])
      setTeams(teamsJson.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
    }, 30000)
    return () => clearInterval(timer)
  }, [load])

  const teamProgressByIdea = useMemo(() => {
    const map = new Map<string, number>()
    teams.forEach((team) => {
      ;(team.ideas || []).forEach((idea) => {
        map.set(idea.id, team.progress || 0)
      })
    })
    return map
  }, [teams])

  const filteredProjects =
    statusFilter === "all"
      ? projects
      : projects.filter((project) => project.status === statusFilter)

  const dashboard = useMemo(() => {
    const total = filteredProjects.length
    const tasks = filteredProjects.flatMap((project) => project.tasks || [])
    const risks = filteredProjects.flatMap((project) => project.project_risks || [])
    const kpis = filteredProjects.flatMap((project) => project.project_kpis || [])

    const delayedTasks = tasks.filter((task) => task.due_date && task.status !== "done" && new Date(task.due_date) < new Date())
    const openRisks = risks.filter((risk) => risk.status !== "closed")

    const avgProgress = total > 0 ? Math.round(filteredProjects.reduce((sum, project) => sum + Number(project.progress || 0), 0) / total) : 0

    return {
      total,
      avgProgress,
      tasks: tasks.length,
      delayedTasks: delayedTasks.length,
      openRisks: openRisks.length,
      activeKpis: kpis.length,
    }
  }, [filteredProjects])

  const updateProject = async (projectId: string, status: string, progress: number) => {
    if (!canManageExecution) return
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

  const exportExecutiveReport = (project: Project) => {
    const delayed = (project.tasks || []).filter((task) => task.due_date && task.status !== "done" && new Date(task.due_date) < new Date()).length
    const openRisks = (project.project_risks || []).filter((risk) => risk.status !== "closed").length
    const teamProgress = teamProgressByIdea.get(project.idea_id) || 0

    const recommendations: string[] = []
    if (delayed > 0) recommendations.push("تصعيد المهام المتأخرة بخطة تسريع أسبوعية")
    if (openRisks > 0) recommendations.push("تحديث سجل المخاطر وخطة التخفيف")
    if ((project.progress || 0) < 40) recommendations.push("مراجعة نطاق المشروع وتقليل العمل غير الحرج")
    if (recommendations.length === 0) recommendations.push("الاستمرار بنفس الإيقاع مع مراقبة KPIs")

    const report = [
      `التقرير التنفيذي - ${project.name}`,
      `حالة المشروع: ${project.status}`,
      `نسبة الإنجاز: ${project.progress}%`,
      `تقدم الفريق: ${teamProgress}%`,
      `إجمالي المهام: ${(project.tasks || []).length}`,
      `المهام المتأخرة: ${delayed}`,
      `المخاطر المفتوحة: ${openRisks}`,
      `KPIs الحالية: ${(project.project_kpis || []).length}`,
      "",
      "تفاصيل KPIs:",
      ...(project.project_kpis || []).map((kpi) => `- ${kpi.name}: ${kpi.current_value ?? "-"}/${kpi.target ?? "-"} ${kpi.unit || ""}`),
      "",
      "التوصيات:",
      ...recommendations.map((r) => `- ${r}`),
    ].join("\n")

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pmo-executive-report-${project.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">مرحلة التنفيذ - PMO</h1>
        <p className="mt-2 text-sm text-slate-300">
          لوحة مشروع كاملة للإدارة: نسبة الإنجاز، المهام المتأخرة، المخاطر المفتوحة، تقدم الفريق، وحالة KPIs.
        </p>
      </section>
      {!canManageExecution && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          وضع القراءة فقط: تحديث حالة المشروع متاح لدور PMO أو الإدارة.
        </section>
      )}

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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">المشاريع</p><p className="mt-1 text-2xl font-semibold text-slate-100">{dashboard.total}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">متوسط الإنجاز</p><p className="mt-1 text-2xl font-semibold text-sky-300">{dashboard.avgProgress}%</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">المهام</p><p className="mt-1 text-2xl font-semibold text-violet-300">{dashboard.tasks}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">المهام المتأخرة</p><p className="mt-1 text-2xl font-semibold text-red-300">{dashboard.delayedTasks}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">المخاطر المفتوحة</p><p className="mt-1 text-2xl font-semibold text-amber-300">{dashboard.openRisks}</p></div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4"><p className="text-xs text-slate-400">KPIs الحالية</p><p className="mt-1 text-2xl font-semibold text-emerald-300">{dashboard.activeKpis}</p></div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-white/20 bg-slate-900/55 p-4 text-slate-300">جارٍ التحميل...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-white/20 bg-slate-900/55 p-4 text-slate-300">
            لا توجد مشاريع تنفيذ حتى الآن. اعتمد فكرة من صفحة التحكيم.
          </div>
        ) : (
          filteredProjects.map((project) => {
            const delayedTasks = (project.tasks || []).filter((task) => task.due_date && task.status !== "done" && new Date(task.due_date) < new Date()).length
            const openRisks = (project.project_risks || []).filter((risk) => risk.status !== "closed").length
            const teamProgress = teamProgressByIdea.get(project.idea_id) || 0

            return (
              <div key={project.id} className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-100">{project.name}</h2>
                    <p className="text-xs text-slate-400">
                      الفكرة: {project.ideas?.title || "-"} | الحالة: {project.status}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                    {project.progress}%
                  </span>
                </div>

                <p className="text-sm text-slate-300">{project.description}</p>
                <p className="mt-2 text-xs text-slate-400">PM: {project.pm_name || "غير محدد"}</p>
                <p className="text-xs text-slate-400">المدة: {project.start_date} إلى {project.end_date}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-300">نسبة الإنجاز: {project.progress}%</div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-300">المهام المتأخرة: {delayedTasks}</div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-300">المخاطر المفتوحة: {openRisks}</div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-300">تقدم الفريق: {teamProgress}%</div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-300">KPIs الحالية: {(project.project_kpis || []).length}</div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button disabled={!canManageExecution} onClick={() => updateProject(project.id, "in_progress", 35)} className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs text-white disabled:opacity-50">بدء التنفيذ</button>
                  <button disabled={!canManageExecution} onClick={() => updateProject(project.id, "monitoring", 75)} className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs text-white disabled:opacity-50">انتقال لقياس الأثر</button>
                  <button disabled={!canManageExecution} onClick={() => updateProject(project.id, "completed", 100)} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs text-white disabled:opacity-50">إغلاق المشروع</button>
                  <button onClick={() => exportExecutiveReport(project)} className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs text-cyan-200">تصدير تقرير إداري</button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-slate-100">المهام</h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {(project.tasks || []).map((task) => (
                        <li key={task.id} className="rounded-xl bg-slate-950/70 px-2 py-2">
                          {task.title} - {task.status}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-slate-100">المخاطر</h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {(project.project_risks || []).map((risk) => (
                        <li key={risk.id} className="rounded-xl bg-slate-950/70 px-2 py-2">
                          {risk.title} - {risk.severity}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-slate-100">KPIs</h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {(project.project_kpis || []).map((kpi) => (
                        <li key={kpi.id} className="rounded-xl bg-slate-950/70 px-2 py-2">
                          {kpi.name}: {kpi.current_value ?? "-"}/{kpi.target ?? "-"} {kpi.unit || ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
