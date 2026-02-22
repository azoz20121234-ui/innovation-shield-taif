export default function Dashboard() {
  return (
    <div className="p-8 text-white space-y-8">

      <h1 className="text-3xl font-bold">لوحة القيادة التنفيذية</h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-6">
        <Card title="المبادرات النشطة" value="24" color="bg-blue-600" />
        <Card title="قيد التحكيم" value="8" color="bg-yellow-500" />
        <Card title="المعتمدة" value="12" color="bg-green-600" />
        <Card title="المخاطر المرتفعة" value="3" color="bg-red-600" />
      </div>

      {/* FUNNEL */}
      <div className="bg-white/5 p-6 rounded-xl">
        <h2 className="mb-4 text-xl font-semibold">مسار الابتكار</h2>

        <div className="flex justify-between text-center">
          <Stage name="فكرة" count="40" />
          <Stage name="مراجعة" count="22" />
          <Stage name="تحكيم" count="15" />
          <Stage name="تنفيذ" count="9" />
          <Stage name="إغلاق" count="4" />
        </div>
      </div>

      {/* ACTIVITY */}
      <div className="bg-white/5 p-6 rounded-xl">
        <h2 className="mb-4 text-xl font-semibold">آخر الأنشطة</h2>

        <ul className="space-y-3 text-gray-300">
          <li>تم اعتماد مبادرة التحول الرقمي</li>
          <li>إضافة تعليق من لجنة التحكيم</li>
          <li>رفع نموذج أولي جديد</li>
          <li>تحديث حالة مبادرة الصحة الذكية</li>
        </ul>
      </div>

    </div>
  )
}

function Card({ title, value, color }: any) {
  return (
    <div className={`${color} p-6 rounded-xl shadow-lg`}>
      <p className="text-sm opacity-80">{title}</p>
      <h3 className="text-2xl font-bold mt-2">{value}</h3>
    </div>
  )
}

function Stage({ name, count }: any) {
  return (
    <div>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm text-gray-400">{name}</div>
    </div>
  )
}
