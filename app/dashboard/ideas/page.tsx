"use client"

import { useInnovation } from "@/context/InnovationContext"

export default function IdeasBoard() {
  const { ideas, moveIdea } = useInnovation()

  const columns = [
    { key: "draft", label: "مسودة" },
    { key: "review", label: "قيد المراجعة" },
    { key: "approved", label: "معتمدة" },
  ]

  return (
    <div style={{ display: "flex", gap: 30 }}>
      {columns.map(col => (
        <div key={col.key} style={styles.column}>
          <h3>{col.label}</h3>

          {ideas.filter(i => i.status === col.key).map(idea => (
            <div key={idea.id} style={styles.card}>
              <p>{idea.title}</p>

              <div style={{ marginTop: 10 }}>
                {col.key !== "draft" && (
                  <button onClick={() => moveIdea(idea.id, "draft")}>⬅</button>
                )}
                {col.key === "draft" && (
                  <button onClick={() => moveIdea(idea.id, "review")}>➡</button>
                )}
                {col.key === "review" && (
                  <button onClick={() => moveIdea(idea.id, "approved")}>✔</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const styles: any = {
  column: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 20
  },
  card: {
    background: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10
  }
}
