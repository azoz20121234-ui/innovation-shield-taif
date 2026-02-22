"use client"

import { useState } from "react"

export default function IdeaAI() {

  const [input, setInput] = useState("")
  const [response, setResponse] = useState("")

  const generate = async () => {
    setResponse("جارٍ التحليل بالذكاء الاصطناعي...")
    
    const res = await fetch("/api/ai", {
      method: "POST",
      body: JSON.stringify({ prompt: input })
    })

    const data = await res.json()
    setResponse(data.result)
  }

  return (
    <div className="max-w-4xl space-y-10">
      <h1 className="text-4xl font-semibold">
        مساعد الابتكار الذكي
      </h1>

      <textarea
        className="w-full p-4 rounded-xl bg-white/10 border border-white/10 h-40"
        placeholder="اكتب فكرتك هنا..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={generate}
        className="px-6 py-3 bg-purple-500 rounded-xl"
      >
        تحليل وتطوير الفكرة
      </button>

      <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
        {response}
      </div>
    </div>
  )
}
