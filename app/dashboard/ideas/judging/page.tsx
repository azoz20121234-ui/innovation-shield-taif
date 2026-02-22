"use client"

import { useInnovation } from "@/context/InnovationContext"

export default function JudgingPanel() {
  const { ideas, scoreIdea } = useInnovation()

  return (
    <div>
      <h1 style={{ marginBottom: 30 }}>لوحة التحكيم 👨🏻‍⚖️</h1>

      {ideas.filter(i => i.status === "review").map(idea => (
        <div key={idea.id} style={styles.card}>
          <h3>{idea.title}</h3>

          <input
            type="range"
            min="1"
            max="10"
            onChange={(e) => scoreIdea(idea.id, Number(e.target.value))}
          />

          <p>التقييم: {idea.score || 0}</p>
        </div>
      ))}
    </div>
  )
}

const styles: any = {
  card: {
    background: "rgba(255,255,255,0.08)",
    padding: 30,
    borderRadius: 20,
    marginBottom: 20
  }
}
