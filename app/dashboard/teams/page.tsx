"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type TeamMember = {
  id: string
  member_name: string
  role: string | null
}

type TeamRecord = {
  id: string
  name: string
  idea_id: string | null
  team_members?: TeamMember[]
}

type IdeaOption = {
  id: string
  title: string
  state: string
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamRecord[]>([])
  const [ideas, setIdeas] = useState<IdeaOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [ideaId, setIdeaId] = useState("")
  const [memberName, setMemberName] = useState("")
  const [memberRole, setMemberRole] = useState("")
  const [memberTeamId, setMemberTeamId] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [teamsRes, ideasRes] = await Promise.all([fetch("/api/teams"), fetch("/api/ideas")])
      const teamsJson = await teamsRes.json()
      const ideasJson = await ideasRes.json()

      if (!teamsRes.ok) throw new Error(teamsJson.error || "تعذر تحميل الفرق")
      if (!ideasRes.ok) throw new Error(ideasJson.error || "تعذر تحميل الأفكار")

      setTeams(teamsJson.data || [])
      setIdeas((ideasJson.data || []).map((item: IdeaOption) => ({ id: item.id, title: item.title, state: item.state })))
      if (!memberTeamId && teamsJson.data?.[0]?.id) setMemberTeamId(teamsJson.data[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }, [memberTeamId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
    }, 30000)
    return () => clearInterval(timer)
  }, [load])

  const ideaName = useMemo(() => {
    const map = new Map<string, string>()
    ideas.forEach((idea) => {
      map.set(idea.id, idea.title)
    })
    return map
  }, [ideas])

  const createTeam = async () => {
    if (!name.trim()) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ideaId: ideaId || null,
          actorId: "team-lead",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء الفريق")

      setName("")
      setIdeaId("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const addMember = async () => {
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
          role: memberRole || null,
          actorId: "team-lead",
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
    try {
      const res = await fetch("/api/team-members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, actorId: "team-lead" }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر حذف العضو")

      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">إدارة فرق الابتكار</h1>
        <p className="mt-2 text-sm text-slate-300">تشكيل الفرق، ربطها بالأفكار، وإدارة الأعضاء داخل مساحة العمل.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">عدد الفرق</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{teams.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">عدد الأعضاء</p>
          <p className="mt-1 text-2xl font-semibold text-sky-300">{teams.reduce((sum, team) => sum + (team.team_members?.length || 0), 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">فرق مرتبطة بفكرة</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{teams.filter((team) => Boolean(team.idea_id)).length}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="text-lg font-semibold text-slate-100">إنشاء فريق</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الفريق"
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
        </div>
        <button
          onClick={createTeam}
          disabled={saving}
          className="mt-4 rounded-2xl bg-sky-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "جارٍ الإنشاء..." : "إنشاء فريق"}
        </button>
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="text-lg font-semibold text-slate-100">إضافة عضو للفريق</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <select
            value={memberTeamId}
            onChange={(e) => setMemberTeamId(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          >
            <option value="">اختر الفريق</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <input
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="اسم العضو"
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
          <input
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
            placeholder="الدور"
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
        </div>
        <button
          onClick={addMember}
          disabled={saving}
          className="mt-4 rounded-2xl bg-violet-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "جارٍ الإضافة..." : "إضافة عضو"}
        </button>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-300">جارٍ التحميل...</div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-300">لا توجد فرق بعد.</div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-100">{team.name}</h3>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  {team.team_members?.length || 0} أعضاء
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                الفكرة المرتبطة: {team.idea_id ? ideaName.get(team.idea_id) || "غير معروفة" : "غير مرتبطة"}
              </p>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {(team.team_members || []).map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                    <p className="text-sm text-slate-200">
                      {member.member_name}
                      <span className="mr-1 text-xs text-slate-400">({member.role || "بدون دور"})</span>
                    </p>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-200"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
