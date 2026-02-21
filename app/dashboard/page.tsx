'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/register')
      } else {
        setUser(data.user)
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/register')
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>مرحباً بك في منصة درع الابتكار 🛡️</h1>
      {user && <p>البريد: {user.email}</p>}
      <button onClick={handleLogout} style={{ marginTop: '20px' }}>
        تسجيل الخروج
      </button>
    </div>
  )
}
