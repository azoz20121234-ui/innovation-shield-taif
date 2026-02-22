'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main style={styles.container}>
      <div style={styles.overlay} />

      <div style={styles.content}>
        <h1 style={styles.title}>
          درع الابتكار 👑
        </h1>

        <p style={styles.subtitle}>
          منصة مؤسسية متكاملة لإدارة دورة حياة الابتكار
          <br />
          من الفكرة إلى التطبيق
        </p>

        <div style={styles.buttons}>
          <Link href="/register">
            <button style={styles.primaryBtn}>
              إنشاء حساب
            </button>
          </Link>

          <Link href="/login">
            <button style={styles.secondaryBtn}>
              تسجيل الدخول
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}

const styles: any = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at top left, #0f2027, #203a43, #2c5364)',
    overflow: 'hidden',
    fontFamily: 'system-ui',
  },

  overlay: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    background: 'rgba(0, 198, 255, 0.15)',
    filter: 'blur(120px)',
    borderRadius: '50%',
    top: '-100px',
    right: '-100px',
  },

  content: {
    position: 'relative',
    textAlign: 'center',
    color: 'white',
    maxWidth: '700px',
    padding: '40px',
  },

  title: {
    fontSize: '52px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },

  subtitle: {
    fontSize: '18px',
    opacity: 0.8,
    marginBottom: '40px',
    lineHeight: '1.6',
  },

  buttons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },

  primaryBtn: {
    padding: '14px 30px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(0, 114, 255, 0.4)',
  },

  secondaryBtn: {
    padding: '14px 30px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'transparent',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
  },
};
