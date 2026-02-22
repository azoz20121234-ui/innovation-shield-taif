"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion } from "framer-motion"

type ChallengeOption = {
  id: string
  title: string
}

export default function NewIdeaPage() {

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [challengeId, setChallengeId] = useState("")
  const [challenges, setChallenges] = useState<ChallengeOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchChallenges = async () => {
      const { data } = await supabase.from("challenges").select("*")
      if (data) setChallenges(data as ChallengeOption[])
    }

    void fetchChallenges()
  }, [])

  const handleSubmit = async () => {
    setLoading(true)

    const { error } = await supabase.from("ideas").insert([
      {
        title,
        description,
        challenge_id: challengeId
      }
    ])

    setLoading(false)

    if (!error) {
      alert("تم إنشاء الفكرة بنجاح 🚀")
      setTitle("")
      setDescription("")
    } else {
      alert("حدث خطأ")
    }
  }

  return (
    <div className="max-w-4xl space-y-10">

      <h1 className="text-4xl font-semibold">
        إنشاء فكرة ابتكارية جديدة
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-10 space-y-6"
      >

        <input
          placeholder="عنوان الفكرة"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 rounded-xl bg-white/10 border border-white/10"
        />

        <textarea
          placeholder="وصف الفكرة"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 rounded-xl bg-white/10 border border-white/10 h-40"
        />

        <select
          value={challengeId}
          onChange={(e) => setChallengeId(e.target.value)}
          className="w-full p-4 rounded-xl bg-white/10 border border-white/10"
        >
          <option value="">اختر التحدي المرتبط</option>
          {challenges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 transition"
        >
          {loading ? "جارٍ الإنشاء..." : "إنشاء الفكرة"}
        </button>

      </motion.div>
    </div>
  )
}
