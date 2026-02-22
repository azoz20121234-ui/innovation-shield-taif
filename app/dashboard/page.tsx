import Link from "next/link"

const valueProposition = [
  "تحويل المشكلات التشغيلية والسريرية إلى حلول قابلة للتنفيذ.",
  "تسريع الابتكار الداخلي وتقليل الهدر عبر مسار واضح من الفكرة إلى التنفيذ.",
  "رفع مشاركة الموظفين عبر نظام نقاط وحوافز مرتبط بالأثر.",
  "توثيق وحماية الملكية الفكرية داخل التجمع الصحي.",
  "توفير بيانات دقيقة وقابلة للقياس لدعم القرار التنفيذي.",
]

const platformModules = [
  "بوابة التحديات المؤسسية مع بيانات داعمة ومؤشرات أثر.",
  "مسارات تقديم أفكار مهيكلة (سريري، تشغيلي، رقمي، صحة مدرسية).",
  "مساعد ابتكار ذكي لتحسين الفكرة وتوليد وصف تنفيذي وخطة أولية.",
  "مساحة عمل الفريق: Kanban، توزيع مهام، سجل تغييرات، ومستودع ملفات.",
  "مولد نماذج أولية يشمل Wireframes وسيناريوهات استخدام واختبار مبدئي.",
  "تحكيم هجين: تقييم AI ثم تحكيم بشري بمعايير موحدة.",
  "إدارة الجوائز والتنفيذ وربطها بميزانية ومسؤول تنفيذ.",
  "دعم حماية الملكية الفكرية عبر ملف إثبات التطوير.",
]

const lifecycle = [
  {
    phase: "طرح التحدي",
    output: "وصف التحدي، البيانات الداعمة، ومعايير النجاح.",
  },
  {
    phase: "تقديم الفكرة",
    output: "نموذج تقديم محسن بالذكاء الاصطناعي وملف تقديمي جاهز.",
  },
  {
    phase: "تحسين الفكرة",
    output: "توصيات AI، نموذج أولي مبدئي، وخطة تنفيذ أولية.",
  },
  {
    phase: "بناء النموذج الأولي",
    output: "واجهات Wireframes، سيناريوهات الاستخدام، واختبار مبكر.",
  },
  {
    phase: "التحكيم",
    output: "تقرير نقاط موحد وتوصية تنفيذية واضحة.",
  },
  {
    phase: "التنفيذ والمتابعة",
    output: "خطة تنفيذ، تقارير مرحلية، وقياس أثر واقعي.",
  },
  {
    phase: "الحماية والنشر",
    output: "ملف حماية IP، نشر داخلي، وخطة دمج داخل الأنظمة.",
  },
]

const quickActions = [
  {
    title: "بوابة التحديات",
    description: "طرح التحديات وربطها بالأثر ومعايير النجاح.",
    href: "/dashboard/challenges",
  },
  {
    title: "مساعد الابتكار AI",
    description: "تحسين الأفكار وتوليد مخرجات تنفيذية أولية.",
    href: "/dashboard/ai",
  },
  {
    title: "لوحة المؤشرات",
    description: "متابعة الأداء والتحويل والتنفيذ والحماية.",
    href: "/dashboard/kpi",
  },
  {
    title: "تقديم فكرة جديدة",
    description: "بدء فكرة ضمن مسار تحدي مؤسسي.",
    href: "/dashboard/new-idea",
  },
]

export default function DashboardPage() {
  return (
    <div dir="rtl" className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-xs text-cyan-200">
          منصة إدارة دورة حياة الابتكار
        </p>
        <h1 className="text-4xl font-semibold leading-tight">
          Innovation Shield لتجمع الطائف الصحي
        </h1>
        <p className="mt-4 max-w-4xl text-white/75">
          منصة رقمية متكاملة تربط الموظفين والإدارات واللجان والمحكمين لإدارة
          الابتكار من طرح التحدي أو الفكرة حتى التنفيذ وحماية الملكية، مع توظيف
          الذكاء الاصطناعي لتسريع التحليل والتطوير واتخاذ القرار.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-2xl font-semibold">القيمة المقترحة</h2>
          <ul className="space-y-3 text-white/80">
            {valueProposition.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-white/10 bg-black/15 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-2xl font-semibold">المكونات الرئيسية</h2>
          <ul className="space-y-3 text-white/80">
            {platformModules.map((module) => (
              <li
                key={module}
                className="rounded-xl border border-white/10 bg-black/15 px-4 py-3"
              >
                {module}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-5 text-2xl font-semibold">رحلة المستخدم ومخرجات كل مرحلة</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lifecycle.map((step) => (
            <div
              key={step.phase}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <h3 className="mb-2 text-lg font-semibold text-cyan-200">
                {step.phase}
              </h3>
              <p className="text-sm text-white/75">{step.output}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-5 text-2xl font-semibold">مسارات سريعة</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
            >
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-white/70">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
