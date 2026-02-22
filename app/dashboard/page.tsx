import Link from "next/link"
import { ArrowUpRight, Bot, ShieldCheck, Sparkles, Users } from "lucide-react"

const valueProposition = [
  "تحويل المشكلات التشغيلية والسريرية إلى حلول قابلة للتنفيذ.",
  "تسريع الابتكار الداخلي وتقليل الهدر عبر مسار واضح من الفكرة إلى التنفيذ.",
  "رفع مشاركة الموظفين وتحفيزهم عبر نظام نقاط ومكافآت.",
  "توثيق وحماية الملكية الفكرية داخل تجمع الطائف الصحي.",
  "توفير بيانات قابلة للقياس تدعم القرار التنفيذي.",
]

const aiComponents = [
  {
    title: "مساعد ابتكار ذكي",
    role: "يحوّل وصف الفكرة إلى ملخص تنفيذي وPitch جاهز للعرض.",
  },
  {
    title: "محلل جدوى تلقائي",
    role: "يقيّم الأثر والجدوى واحتمالات تكرار المبادرة قبل التحكيم.",
  },
  {
    title: "مولد نماذج أولية",
    role: "ينتج Wireframes ونماذج استخدام قابلة للتعديل من الفريق.",
  },
  {
    title: "مُقَيّم مخاطر",
    role: "يحدد مخاطر الخصوصية والتشغيل والتكامل بشكل مبكر.",
  },
  {
    title: "كاشف التكرار",
    role: "يقارن الفكرة بقاعدة داخلية وخارجية لتقليل التكرار.",
  },
  {
    title: "توصيف حماية الملكية",
    role: "يقترح نوع الحماية ويولد مسودة ملف رفع أولي.",
  },
]

const lifecycle = [
  {
    phase: "1) طرح التحدي أو تقديم الفكرة",
    output: "بدء الرحلة عبر بوابة التحديات أو نموذج فكرة جديد.",
  },
  {
    phase: "2) تحسين تلقائي بالفحص AI",
    output: "تحليل الفكرة تلقائيًا وتوليد ملخص تنفيذي وPitch أولي.",
  },
  {
    phase: "3) تشكيل فريق ومساحة عمل",
    output: "تكوين فريق متعدد التخصصات مع مساحة عمل تعاونية.",
  },
  {
    phase: "4) بناء نموذج أولي وتجربة مبدئية",
    output: "إنتاج Wireframes وتجربة استخدام أولية قبل التحكيم.",
  },
  {
    phase: "5) تحكيم AI ثم بشري",
    output: "تقييم هجين بمعايير موحدة وتوصية رسمية.",
  },
  {
    phase: "6) قرار تنفيذ وتعيين مدير مشروع",
    output: "اعتماد المبادرة وتحديد مالك التنفيذ وخطة الانطلاق.",
  },
  {
    phase: "7) تنفيذ ومتابعة قياس الأثر",
    output: "متابعة مرحلية، مؤشرات أداء، وقياس أثر فعلي.",
  },
  {
    phase: "8) حماية ونشر وتوثيق الدروس المستفادة",
    output: "ملف حماية الملكية، نشر داخلي، وتوثيق المعرفة المؤسسية.",
  },
]

const quickActions = [
  {
    title: "بوابة التحديات",
    description: "عرض التحديات المؤسسية وربطها بالمؤشرات.",
    href: "/dashboard/challenges",
  },
  {
    title: "تكوين فرق الابتكار",
    description: "انضمام فريق ومساحة عمل مشتركة.",
    href: "/dashboard/teams",
  },
  {
    title: "مساعد AI",
    description: "تحسين الفكرة وتحليل الجدوى والمخاطر.",
    href: "/dashboard/ai",
  },
  {
    title: "إدارة المهام",
    description: "توزيع المهام ومتابعة الإنجاز.",
    href: "/dashboard/tasks",
  },
  {
    title: "النماذج الأولية",
    description: "إنتاج واجهات أولية وسيناريوهات الاستخدام.",
    href: "/dashboard/prototypes",
  },
  {
    title: "لوحة المؤشرات",
    description: "قياس التحويل، التنفيذ، والحماية.",
    href: "/dashboard/kpi",
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8" dir="rtl">
      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,#0b1220_0%,#0f2e44_45%,#075985_100%)] p-8 text-white md:p-10">
        <p className="mb-4 inline-flex rounded-full border border-cyan-100/30 bg-cyan-200/20 px-4 py-1 text-xs">
          منصة حكومية لتجمع الطائف الصحي
        </p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
          Innovation Shield
          <br />
          تنظيم رحلة الابتكار المؤسسي بالكامل
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-cyan-50/90 md:text-base">
          منصة رقمية متكاملة لإدارة دورة حياة الابتكار من التحدي والفكرة حتى
          التنفيذ وحماية الملكية، مع تمكين الفريق، مساحة العمل، ومساعدة AI في كل
          مرحلة.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/75 bg-white/70 p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-sky-700" />
            <h2 className="text-2xl font-semibold text-slate-900">القيمة المقترحة</h2>
          </div>
          <ul className="space-y-3">
            {valueProposition.map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/75 bg-white/70 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bot size={18} className="text-sky-700" />
            <h2 className="text-2xl font-semibold text-slate-900">مكونات الذكاء الاصطناعي ودوره</h2>
          </div>
          <div className="grid gap-3">
            {aiComponents.map((component) => (
              <div key={component.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">{component.title}</p>
                <p className="mt-1 text-sm text-slate-600">{component.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/75 bg-white/70 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-sky-700" />
          <h2 className="text-2xl font-semibold text-slate-900">رحلة الابتكار ومخرجات كل مرحلة</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {lifecycle.map((step) => (
            <div key={step.phase} className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-base font-semibold text-slate-900">{step.phase}</h3>
              <p className="mt-1 text-sm text-slate-600">{step.output}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/75 bg-white/70 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Users size={18} className="text-sky-700" />
          <h2 className="text-2xl font-semibold text-slate-900">المسارات التشغيلية السريعة</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-sky-300 hover:shadow-[0_12px_30px_rgba(14,165,233,0.12)]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <ArrowUpRight size={18} className="text-sky-600" />
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
