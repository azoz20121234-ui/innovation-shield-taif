'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage('❌ ' + error.message);
      setLoading(false);
    } else {
      setMessage('✅ تم تسجيل الدخول بنجاح!');
      router.push('/dashboard'); // يحول المستخدم لصفحة لوحة التحكم
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>تسجيل الدخول</h1>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    fontFamily: 'system-ui',
  },
  card: {
    width: '400px',
    padding: '40px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    color: 'white',
    textAlign: 'center',
  },
  title: { marginBottom: '20px', fontSize: '26px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: {
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
  },
  button: {
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: '#00c6ff',
    color: 'black',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  message: { marginTop: '20px', fontSize: '14px' },
};
