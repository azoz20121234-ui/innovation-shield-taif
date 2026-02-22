import Link from "next/link"
import { LayoutDashboard, BarChart3, Brain, Lightbulb, Shield } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex relative text-white overflow-hidden">

      {/* Background Gradient Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]" />
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full" />

      <div className="relative flex w-full">

        {/* Sidebar Glass */}
        <aside className="w-72 backdrop-blur-xl bg-white/5 border-r border-white/10 p-8 flex flex-col justify-between">

          <div>
            <div className="flex items-center gap-3 mb-12">
              <Shield className="text-cyan-400" />
              <h1 className="text-xl font-semibold tracking-wide">
                Innovation Shield
              </h1>
            </div>

            <nav className="space-y-5 text-sm">
              <Link href="/dashboard" className="flex items-center gap-3 hover:text-cyan-300 transition">
                <LayoutDashboard size={18}/> الرئيسية
              </Link>

              <Link href="/dashboard/challenges" className="flex items-center gap-3 hover:text-cyan-300 transition">
                <Lightbulb size={18}/> التحديات
              </Link>

              <Link href="/dashboard/kpi" className="flex items-center gap-3 hover:text-cyan-300 transition">
                <BarChart3 size={18}/> المؤشرات
              </Link>

              <Link href="/dashboard/ai" className="flex items-center gap-3 hover:text-cyan-300 transition">
                <Brain size={18}/> الذكاء الاصطناعي
              </Link>
            </nav>
          </div>

          <div className="text-xs text-white/40">
            Executive Edition
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col">

          {/* Topbar Glass */}
          <header className="h-20 backdrop-blur-xl bg-white/5 border-b border-white/10 flex items-center justify-between px-10">
            <h2 className="text-sm text-white/70 tracking-wide">
              Executive Dashboard
            </h2>

            <div className="flex items-center gap-4">
              <div className="px-4 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
                Live
              </div>
              <div className="w-9 h-9 rounded-full bg-cyan-400/50 backdrop-blur-lg border border-white/20" />
            </div>
          </header>

          <main className="p-14 flex-1">
            {children}
          </main>

        </div>

      </div>
    </div>
  )
}
