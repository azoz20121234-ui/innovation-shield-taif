"use client"

export default function JudgingPanel() {
  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>لوحة التحكيم 👨🏻‍⚖️</h1>

      <div style={styles.card}>
        <h3>نظام فرز ذكي للطوارئ</h3>
        <p>تقييم الابتكار:</p>
        <div style={styles.scoreRow}>
          <Score label="الأثر" />
          <Score label="القابلية للتنفيذ" />
          <Score label="الابتكار" />
        </div>
        <button style={styles.approveBtn}>اعتماد</button>
      </div>
    </div>
  )
}

function Score({ label }: { label: string }) {
  return (
    <div style={{ flex: 1 }}>
      <p>{label}</p>
      <input type="range" min="1" max="10" />
    </div>
  )
}

const styles: any = {
  card: {
    background: "rgba(255,255,255,0.08)",
    padding: "30px",
    borderRadius: "20px"
  },
  scoreRow: {
    display: "flex",
    gap: "20px",
    margin: "20px 0"
  },
  approveBtn: {
    padding: "10px 20px",
    borderRadius: "10px",
    background: "#2ecc71",
    border: "none",
    color: "white"
  }
}
