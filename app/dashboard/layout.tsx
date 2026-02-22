"use client"

import Link from "next/link"
import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={styles.wrapper}>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>🛡 درع الابتكار</div>

        <nav style={styles.nav}>
          <NavItem href="/dashboard" label="الرئيسية" />
          <NavItem href="/dashboard/ideas" label="الأفكار" />
          <NavItem href="#" label="التحكيم" />
          <NavItem href="#" label="المؤشرات" />
          <NavItem href="#" label="السياسات" />
        </nav>
      </aside>

      {/* Main */}
      <div style={styles.main}>
        <header style={styles.topbar}>
          <div>لوحة التحكم التنفيذية</div>
          <div style={styles.badge}>Innovation System v1.0</div>
        </header>

        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  )
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={styles.navItem}>
      {label}
    </Link>
  )
}

const styles: any = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    direction: "rtl",
    fontFamily: "system-ui, sans-serif",
    background: "radial-gradient(circle at top left, #0f2027, #203a43, #2c5364)",
    color: "white"
  },
  sidebar: {
    width: "260px",
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(20px)",
    padding: "30px 20px",
    borderLeft: "1px solid rgba(255,255,255,0.1)"
  },
  logo: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "40px"
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  navItem: {
    padding: "12px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: "white",
    background: "rgba(255,255,255,0.05)",
    transition: "0.2s ease"
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },
  topbar: {
    height: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 40px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.2)",
    backdropFilter: "blur(20px)"
  },
  badge: {
    fontSize: "12px",
    opacity: 0.6
  },
  content: {
    padding: "40px"
  }
}
