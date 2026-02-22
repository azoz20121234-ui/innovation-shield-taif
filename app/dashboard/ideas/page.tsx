"use client"
import { useEffect, useState } from "react"
import { supabase } from @/lib/supabaseClient"

type IdeaRecord = {
  id: string
  title: string
  description: string | null
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<IdeaRecord[]>([])

  useEffect(() => {
    const fetchIdeas = async () => {
      const { data } = await supabase.from("ideas").select("*")
      if (data) setIdeas(data as IdeaRecord[])
    }

    void fetchIdeas()
  }, [])

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-semibold">الأفكار الابتكارية</h1>
      {ideas.map((idea) => (
        <div
          key={idea.id}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
        >
          <h2 className="text-xl font-bold">{idea.title}</h2>
          <p className="text-white/60 mt-2">{idea.description}</p>
        </div>
      ))}
    </div>
  )
}
