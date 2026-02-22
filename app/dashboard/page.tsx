"use client"

import Link from "next/link"

export default function Dashboard() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>🛡 درع الابتكار</h1>
        <p style={styles.subtitle}>لوحة التحكم التنفيذية</p>
      </div>

      <div style={styles.grid}>
        <Card
          title="💡 إدارة الأفكار"
          desc="عرض جميع المبادرات وتتبع مراحلها"
          link="/dashboard/ideas"
        />
        <Card
          title="⚖️ مسار التحكيم"
          desc="إدارة تقييم المبادرات والقرارات"
          link="#"
        />
        <Card
          title="📊 المؤشرات التنفيذية"
          desc="KPIs وتحليل الأداء والمخاطر"
          link="#"
        />
        <Card
          title="📜 السياسات والحوكمة"
          desc="إدارة السياسات وسير الاعتماد"
          link="#"
        />
      </div>
    </div>
  )
}

function Card({
  title,
  desc,
  link
}: {
  title: string
  desc: string
  link: string
}) {
  return (
    <Link href={link} style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDesc}>{desc}</p>
    </Link>
  )
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #0f2027, #203a43, #2c5364)",
    padding: "60px 40px",
    direction: "rtl",
    fontFamily: "system-ui, sans-serif",
    color: "white"
  },
  header: {
    textAlign: "center",
    marginBottom: "60px"
  },
  title: {
    fontSize: "40px",
    fontWeight: 700,
    marginBottom: "10px"
  },
  subtitle: {
    opacity: 0.7
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "30px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(15px)",
    padding: "30px",
    borderRadius: "20px",
    textDecoration: "none",
    color: "white",
    transition: "0.3s ease",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
  },
  cardTitle: {
    fontSize: "20px",
    marginBottom: "10px"
  },
  cardDesc: {
    opacity: 0.7,
    fontSize: "14px"
  }
}
