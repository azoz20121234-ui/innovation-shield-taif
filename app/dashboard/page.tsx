"use client"

export default function DashboardHome() {
  return (
    <div style={styles.grid}>
      <StatCard title="إجمالي المبادرات" value="24" />
      <StatCard title="قيد المراجعة" value="7" />
      <StatCard title="معتمدة" value="11" />
      <StatCard title="قيد التنفيذ" value="6" />
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  )
}

const styles: any = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "30px"
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(15px)",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
  },
  cardTitle: {
    opacity: 0.7,
    marginBottom: "10px"
  },
  cardValue: {
    fontSize: "36px",
    fontWeight: "bold"
  }
}
