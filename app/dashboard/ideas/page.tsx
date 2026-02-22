"use client"

import { useState } from "react"

type Idea = {
  id: number
  title: string
  status: "draft" | "review" | "approved"
}

export default function IdeasBoard() {
  const [ideas, setIdeas] = useState<Idea[]>([
    { id: 1, title: "نظام فرز ذكي للطوارئ", status: "draft" },
    { id: 2, title: "لوحة متابعة الأسرة", status: "review" },
    { id: 3, title: "نظام ذكاء اصطناعي للتحاليل", status: "approved" },
  ])

  const moveIdea = (id: number, newStatus: Idea["status"]) => {
    setIdeas(prev =>
      prev.map(i => i.id === id ? { ...i, status: newStatus } : i)
    )
  }

  const columns = [
    { key: "draft", label: "مسودة" },
    { key: "review", label: "قيد المراجعة" },
    { key: "approved", label: "معتمدة" },
  ]

  return (
    <div style={styles.board}>
      {columns.map(col => (
        <div key={col.key} style={styles.column}>
          <h3>{col.label}</h3>
          {ideas.filter(i => i.status === col.key).map(idea => (
            <div key={idea.id} style={styles.card}>
              <p>{idea.title}</p>
              <div style={styles.actions}>
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
  board: {
    display: "flex",
    gap: "30px"
  },
  column: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "20px"
  },
  card: {
    background: "rgba(255,255,255,0.1)",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "10px"
  },
  actions: {
    display: "flex",
    gap: "5px",
    marginTop: "10px"
  }
}
