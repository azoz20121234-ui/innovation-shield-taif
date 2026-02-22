'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={styles.wrapper}>
      
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>درع الابتكار 👑</h2>

        <nav style={styles.nav}>
          <Link href="/dashboard">الرئيسية</Link>
          <Link href="/dashboard/ideas">الأفكار</Link>
          <Link href="/dashboard/challenges">التحديات</Link>
          <Link href="/dashboard/profile">الملف الشخصي</Link>
        </nav>
      </aside>

      {/* Main Area */}
      <div style={styles.main}>
        <header style={styles.header}>
          لوحة التحكم
        </header>

        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg,#0f2027,#203a43,#2c5364)',
    color: 'white',
    fontFamily: 'system-ui',
  },

  sidebar: {
    width: '260px',
    padding: '30px 20px',
    background: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  },

  logo: {
    marginBottom: '40px',
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  main: {
    flex: 1,
    padding: '30px',
  },

  header: {
    fontSize: '22px',
    marginBottom: '30px',
    opacity: 0.8,
  },

  content: {
    background: 'rgba(255,255,255,0.05)',
    padding: '30px',
    borderRadius: '20px',
    backdropFilter: 'blur(20px)',
  },
};
