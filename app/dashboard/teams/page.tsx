"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type TeamRecord = {
  id: string
  name: string
}

export default function TeamsPage() {

  const [teams, setTeams] = useState<TeamRecord[]>([])
  const [name, setName] = useState("")

  const loadTeams = async () => {
    const { data } = await supabase.from("teams").select("*")
    if (data) setTeams(data as TeamRecord[])
  }

  useEffect(() => {
    const fetchInitialTeams = async () => {
      const { data } = await supabase.from("teams").select("*")
      if (data) setTeams(data as TeamRecord[])
    }

    void fetchInitialTeams()
  }, [])

  const createTeam = async () => {
    if (!name.trim()) return

    await supabase.from("teams").insert([{ name }])
    setName("")
    await loadTeams()
  }

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-semibold">
        إدارة الفرق الابتكارية
      </h1>

      <div className="flex gap-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسم الفريق"
          className="p-3 rounded-xl bg-white/10 border border-white/10"
        />
        <button
          onClick={createTeam}
          className="px-6 py-3 bg-cyan-500 rounded-xl"
        >
          إنشاء فريق
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <h2 className="text-xl">{team.name}</h2>
          </div>
        ))}
      </div>

    </div>
  )
}
