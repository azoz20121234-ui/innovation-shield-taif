"use client"

export default function DashboardHome() {
  return (
    <div>
      <h1 style={{ marginBottom: 30 }}>لوحة المؤشرات 📊</h1>

      <div style={styles.chart}>
        <Bar label="مسودة" value={40} color="#f39c12" />
        <Bar label="مراجعة" value={25} color="#3498db" />
        <Bar label="معتمدة" value={60} color="#2ecc71" />
      </div>
    </div>
  )
}

function Bar({ label, value, color }: any) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p>{label}</p>
      <div style={styles.barBg}>
        <div style={{ ...styles.barFill, width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

const styles: any = {
  chart: {
    maxWidth: "600px"
  },
  barBg: {
    height: "14px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "10px",
    overflow: "hidden"
  },
  barFill: {
    height: "100%",
    transition: "0.5s ease"
  }
}
