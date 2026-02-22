"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("❌ " + error.message);
    } else {
      setMessage("✅ تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني.");
      setTimeout(() => {
        router.push("/");
      }, 3000);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>إنشاء حساب 🚀</h1>
        <p style={styles.subtitle}>منصة درع الابتكار</p>

        <form onSubmit={handleRegister} style={styles.form}>
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
            {loading ? "جاري الإنشاء..." : "إنشاء الحساب"}
          </button>
        </form>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    fontFamily: "system-ui",
  },
  card: {
    width: "400px",
    padding: "40px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    color: "white",
    textAlign: "center",
  },
  title: {
    marginBottom: "10px",
    fontSize: "28px",
  },
  subtitle: {
    marginBottom: "30px",
    opacity: 0.7,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    outline: "none",
    fontSize: "14px",
  },
  button: {
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#00c6ff",
    color: "black",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
  },
  message: {
    marginTop: "20px",
    fontSize: "14px",
  },
};
