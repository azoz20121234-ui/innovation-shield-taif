import "./globals.css"

export const metadata = {
  title: "درع الابتكار",
  description: "منصة إدارة الابتكار المؤسسي",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-950 text-white">
        {children}
      </body>
    </html>
  )
}
