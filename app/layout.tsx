import "./globals.css"
import { InnovationProvider } from "@/context/InnovationContext"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <InnovationProvider>
          {children}
        </InnovationProvider>
      </body>
    </html>
  )
}
