"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function NewChallengePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [department, setDepartment] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: any) {
    e.preventDefault()
    setLoading(true)

    await supabase.from("challenges").insert([
      {
        title,
        description,
        department,
      },
    ])

    setLoading(false)
    router.push("/dashboard/challenges")
  }

  return (
    <div className="p-10 min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white">
      <h1 className="text-2xl font-bold mb-6">طرح تحدي جديد</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <input
          type="text"
          placeholder="عنوان التحدي"
          className="w-full p-3 rounded bg-white/10"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="وصف التحدي"
          className="w-full p-3 rounded bg-white/10"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="text"
          placeholder="الإدارة"
          className="w-full p-3 rounded bg-white/10"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />

        <button
          type="submit"
          className="bg-blue-500 px-6 py-3 rounded"
          disabled={loading}
        >
          {loading ? "جارٍ الحفظ..." : "إنشاء التحدي"}
        </button>
      </form>
    </div>
  )
}
