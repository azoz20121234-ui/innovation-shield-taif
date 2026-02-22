"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function DashboardPage() {
  const [challengeCount, setChallengeCount] = useState(0)
  const [ideaCount, setIdeaCount] = useState(0)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const { count: challenges } = await supabase
      .from("challenges")
      .select("*", { count: "exact", head: true })

    const { count: ideas } = await supabase
      .from("ideas")
      .select("*", { count: "exact", head: true })

    setChallengeCount(challenges || 0)
    setIdeaCount(ideas || 0)
  }

  return (
    <div className="p-10 min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white">
      <h1 className="text-3xl font-bold mb-10">لوحة التحكم التنفيذية</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/10 p-6 rounded-xl backdrop-blur">
          <h2 className="text-lg">عدد التحديات</h2>
          <p className="text-4xl mt-4 font-bold">{challengeCount}</p>
        </div>

        <div className="bg-white/10 p-6 rounded-xl backdrop-blur">
          <h2 className="text-lg">عدد الأفكار</h2>
          <p className="text-4xl mt-4 font-bold">{ideaCount}</p>
        </div>
      </div>
    </div>
  )
}
