export default function Dashboard() {
  return (
    <div className="space-y-10">

      <h1 className="text-3xl font-semibold tracking-tight">
        لوحة المؤشرات التنفيذية
      </h1>

      {/* KPI Section */}
      <div className="grid grid-cols-4 gap-6">

        <KPI title="إجمالي المبادرات" value="24" />

        <KPI title="قيد المراجعة" value="5" accent="warning" />

        <KPI title="معتمدة" value="12" accent="success" />

        <KPI title="متعثرة" value="2" accent="danger" />

      </div>

      {/* Chart Placeholder */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
        <h2 className="mb-6 text-lg font-medium">تحليل الأداء الزمني</h2>
        <div className="h-64 flex items-center justify-center text-white/40">
          [ Chart Engine Coming Soon ]
        </div>
      </div>

    </div>
  )
}

function KPI({ title, value, accent }: any) {

  const colors: any = {
    success: "text-[#00C48C]",
    warning: "text-[#F5A623]",
    danger: "text-[#FF4D4F]",
    default: "text-[#2EC4FF]"
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition">

      <div className="text-sm text-white/60 mb-3">
        {title}
      </div>

      <div className={`text-3xl font-semibold ${colors[accent] || colors.default}`}>
        {value}
      </div>

    </div>
  )
}
