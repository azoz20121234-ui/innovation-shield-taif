import Link from "next/link"
import {
  LayoutDashboard,
  BarChart3,
  Brain,
  Lightbulb,
  Shield,
  Users,
  ListTodo,
  Layers3,
  PlusSquare,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "لوحة القيادة", icon: LayoutDashboard },
  { href: "/dashboard/challenges", label: "التحديات", icon: Lightbulb },
  { href: "/dashboard/new-idea", label: "تقديم فكرة", icon: PlusSquare },
  { href: "/dashboard/ideas", label: "الأفكار", icon: Layers3 },
  { href: "/dashboard/ai", label: "مساعد AI", icon: Brain },
  { href: "/dashboard/teams", label: "الفرق", icon: Users },
  { href: "/dashboard/tasks", label: "المهام", icon: ListTodo },
  { href: "/dashboard/kpi", label: "المؤشرات", icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-[#f4f6f9] text-[#0f172a]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(2,132,199,0.16),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(14,165,233,0.12),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef3f8_60%,#ecf2f8_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1700px] p-4 lg:p-6">
        <aside className="glass-surface hidden w-72 flex-col justify-between rounded-3xl p-6 lg:flex">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="rounded-2xl bg-[#0f172a] p-2.5 text-white">
                <Shield size={20} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#0f172a]">درع الابتكار</h1>
                <p className="text-xs text-[#475569]">تجمع الطائف الصحي</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#334155] transition hover:bg-white hover:text-[#0f172a]"
                  >
                    <Icon size={17} className="text-[#0ea5e9] transition group-hover:text-[#0369a1]" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-xs text-[#64748b]">الحالة التشغيلية</p>
            <p className="mt-1 text-sm font-semibold text-[#0f172a]">منصة حكومية - إصدار تنفيذي</p>
            <p className="mt-2 text-xs text-[#0ea5e9]">AI + تحكيم بشري + تنفيذ</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:mr-6">
          <header className="glass-surface mb-4 flex h-20 items-center justify-between rounded-3xl px-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full border border-[#bae6fd] bg-[#e0f2fe] px-3 py-1 text-xs font-medium text-[#0369a1]">
                Ready
              </div>
              <h2 className="text-sm font-medium tracking-wide text-[#334155]">
                رحلة الابتكار المؤسسية - Innovation Shield
              </h2>
            </div>

            <div className="rounded-full bg-white p-1.5 shadow-sm">
              <div className="h-8 w-8 rounded-full bg-[linear-gradient(135deg,#0ea5e9,#2563eb)]" />
            </div>
          </header>

          <main className="glass-surface min-h-[calc(100vh-9.5rem)] flex-1 rounded-3xl p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
