import "./globals.css"

export default function RootLayout({ children }: any) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#0B1F2A] text-white">

        {/* Top Government Bar */}
        <header className="h-14 bg-[#0F2A35]/80 backdrop-blur-xl border-b border-white/10 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold tracking-wide">درع الابتكار</span>
            <span className="text-xs bg-[#00C48C]/20 text-[#00C48C] px-3 py-1 rounded-full">
              Production
            </span>
          </div>

          <div className="text-sm text-white/60">
            Innovation System v1.0
          </div>
        </header>

        <div className="flex h-[calc(100vh-56px)]">

          {/* Sidebar */}
          <aside className="w-72 bg-[#0F2A35]/70 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between">

            <div>
              <h2 className="text-xl font-semibold mb-10">
                لوحة التحكم التنفيذية
              </h2>

              <nav className="space-y-3 text-sm">
                <NavItem name="الرئيسية" href="/dashboard" />
                <NavItem name="المبادرات" href="/initiatives" />
                <NavItem name="التحكيم" href="/committees" />
                <NavItem name="المخاطر" href="/risk" />
                <NavItem name="السياسات" href="/policies" />
                <NavItem name="التحليلات" href="/analytics" />
                <NavItem name="التقارير" href="/reports" />
              </nav>
            </div>

            <div className="text-xs text-white/40">
              © 2026 Innovation Shield
            </div>

          </aside>

          {/* Main */}
          <main className="flex-1 p-10 overflow-y-auto bg-gradient-to-br from-[#0B1F2A] to-[#08151D]">
            {children}
          </main>

        </div>

      </body>
    </html>
  )
}

function NavItem({ name, href }: any) {
  return (
    <a
      href={href}
      className="block px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition duration-300 border border-white/5 hover:border-[#2EC4FF]/30"
    >
      {name}
    </a>
  )
}
