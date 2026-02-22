"use client"

import { useInnovation } from "@/context/InnovationContext"

export default function DashboardHome() {
  const { ideas } = useInnovation()

  const draft = ideas.filter(i => i.status === "draft").length
  const review = ideas.filter(i => i.status === "review").length
  const approved = ideas.filter(i => i.status === "approved").length

  return (
    <div>
      <h1 style={{ marginBottom: 30 }}>لوحة المؤشرات 📊</h1>

      <Stat title="مسودة" value={draft} />
      <Stat title="مراجعة" value={review} />
      <Stat title="معتمدة" value={approved} />
    </div>
  )
}

function Stat({ title, value }: any) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.08)",
      padding: 25,
      borderRadius: 20,
      marginBottom: 20
    }}>
      <h3>{title}</h3>
      <h1>{value}</h1>
    </div>
  )
}
