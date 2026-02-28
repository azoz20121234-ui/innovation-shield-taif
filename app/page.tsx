import { Noto_Kufi_Arabic } from "next/font/google"
import {
  Activity,
  Ambulance,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  HeartPulse,
  RadioTower,
  ShieldAlert,
  Watch,
  Waves,
} from "lucide-react"

const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
})

const flowItems = [
  {
    title: "السوار الصحي الذكي (BLE Wristband)",
    description: "يقوم السوار بقياس نبض القلب وحرارة الجلد والحركة، ثم يرسل البيانات بشكل مجهول الهوية لضمان الخصوصية.",
    icon: Watch,
  },
  {
    title: "بوابات الاستقبال (BLE Gateways)",
    description: "محطات موزعة في المشاعر تستقبل إشارات الأسوار وتنقلها فوراً إلى سحابة المنصة للتحليل اللحظي.",
    icon: RadioTower,
  },
  {
    title: "لوحة القيادة الوطنية والذكاء الاصطناعي",
    description: "تحليل البيانات لحظياً للتنبؤ بالمخاطر وإصدار تنبيهات فورية بمستويات استجابة متعددة.",
    icon: BrainCircuit,
  },
]

const responseLevels = [
  {
    title: "المستوى الأول: الاستجابة الوقائية",
    badge: "تنبيه أصفر",
    description: "توجيه تنبيهات مبكرة للحجاج مع توصيات مباشرة مثل شرب السوائل أو الانتقال لمناطق التبريد.",
    icon: Waves,
    color: "from-yellow-400/20 to-amber-300/10 border-yellow-400/30",
  },
  {
    title: "المستوى الثاني: التدخل الطبي العاجل",
    badge: "تنبيه أحمر",
    description: "رصد الحالات مرتفعة الخطورة وتوجيه الفرق الطبية الميدانية إلى موقع الحالة للتدخل السريع.",
    icon: Ambulance,
    color: "from-rose-500/20 to-red-400/10 border-rose-400/30",
  },
  {
    title: "المستوى الثالث: إدارة الأزمات",
    badge: "المستوى الوطني",
    description: "استخدام خرائط المخاطر الحرارية لاتخاذ قرارات تشغيلية مثل إعادة التوجيه أو الإغلاق المرحلي.",
    icon: ShieldAlert,
    color: "from-orange-500/20 to-amber-400/10 border-orange-400/35",
  },
]

const impactItems = [
  {
    title: "خفض الحالات الحرجة",
    value: "25% - 40%",
    description: "التدخل الاستباقي يقلل من تفاقم الإجهاد الحراري إلى حالات طبية طارئة.",
    icon: AlertTriangle,
  },
  {
    title: "تعزيز إدارة الحشود صحياً",
    value: "ربط لحظي",
    description: "الربط بين البيانات الصحية اللحظية وتوزيع الكثافات يرفع الجاهزية الميدانية.",
    icon: HeartPulse,
  },
  {
    title: "كفاءة توزيع الفرق الطبية",
    value: "توجيه ذكي",
    description: "إدارة الموارد الطبية بناءً على الإنذار الفعلي واللحظي عبر المنصة.",
    icon: BarChart3,
  },
]

export default function HomePage() {
  return (
    <main className={`${kufi.className} min-h-screen bg-slate-100 text-slate-900`} dir="rtl">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-xl shadow-slate-300/30 sm:px-10 sm:py-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold text-sky-700">
            <Activity size={14} />
            منصة المسار الصحي التنبؤية
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            بروتوكول الاستجابة الميدانية للحشود الصحية
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            صفحة تعريفية لنموذج عمل رقمي يربط بين أجهزة الاستشعار القابلة للارتداء، وبوابات الاستقبال، وتحليلات الذكاء
            الاصطناعي؛ للتنبؤ المبكر بالمخاطر الصحية في المشاعر ودعم القرارات التشغيلية بسرعة ودقة.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-300/20 sm:p-8">
          <h2 className="text-2xl font-bold">دورة تدفق البيانات (Data Flow)</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {flowItems.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 inline-flex rounded-xl bg-sky-100 p-2 text-sky-700">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-lg font-bold leading-8">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">مستويات الاستجابة</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {responseLevels.map((level) => {
              const Icon = level.icon
              return (
                <article key={level.title} className={`rounded-2xl border bg-gradient-to-b p-5 ${level.color}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-bold">{level.badge}</span>
                    <div className="rounded-xl border border-black/10 bg-white/80 p-2 text-slate-700">
                      <Icon size={17} />
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold">{level.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{level.description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-300/20 sm:p-8">
          <h2 className="text-2xl font-bold">الأثر التشغيلي والصحي المتوقع</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {impactItems.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
                    <Icon size={18} />
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">{item.value}</p>
                  <h3 className="mt-1 text-lg font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
