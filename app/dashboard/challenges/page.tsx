"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import Link from "next/link"

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenges()
  }, [])

  async function fetchChallenges() {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase Error:", error)
    }

    setChallenges(data || [])
    setLoading(false)
  }

  return (
    <div className="p-10 min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">بوابة التحديات</h1>
        <Link
          href="/dashboard/challenges/new"
          className="bg-green-500 px-4 py-2 rounded"
        >
          + طرح تحدي
        </Link>
      </div>

      {loading && <p>جاري التحميل...</p>}

      {!loading && challenges.length === 0 && (
        <p className="opacity-70">لا يوجد تحديات حالياً</p>
      )}

      <div className="space-y-4 mt-4">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="bg-white/10 backdrop-blur p-6 rounded-xl border border-white/10"
          >
            <h2 className="text-xl font-semibold">{challenge.title}</h2>
            <p className="text-sm opacity-70">{challenge.department}</p>
            <p className="mt-2 opacity-90">{challenge.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
