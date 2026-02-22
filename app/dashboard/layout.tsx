export default function RootLayout({ children }: any) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#0c1e25] text-white font-sans">

        <div className="flex h-screen">

          {/* Sidebar */}
          <aside className="w-64 bg-[#102a33] p-6 border-l border-white/10">
            <h2 className="text-xl font-bold mb-8">درع الابتكار</h2>

            <nav className="space-y-4 text-sm">
              <NavItem name="لوحة القيادة" href="/dashboard" />
              <NavItem name="المبادرات" href="/initiatives" />
              <NavItem name="التحكيم" href="/committees" />
              <NavItem name="المخاطر" href="/risk" />
              <NavItem name="السياسات" href="/policies" />
              <NavItem name="التقارير" href="/reports" />
              <NavItem name="التحليلات" href="/analytics" />
              <NavItem name="الإعدادات" href="/settings" />
            </nav>
          </aside>

          {/* Main */}
          <main className="flex-1 p-8 overflow-y-auto">
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
      className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
    >
      {name}
    </a>
  )
}
