"use client"

import { useRouter } from "next/navigation"

export default function Login() {
  const router = useRouter()

  const login = (role: string) => {
    document.cookie = "role=" + role
    router.push("/dashboard")
  }

  return (
    <div className="h-screen flex items-center justify-center bg-[#0b1620] text-white">
      <div className="space-y-6">
        <h1 className="text-3xl">اختر دورك</h1>
        <button onClick={() => login("employee")} className="bg-cyan-500 px-6 py-3 rounded-xl">موظف</button>
        <button onClick={() => login("committee")} className="bg-purple-500 px-6 py-3 rounded-xl">لجنة</button>
        <button onClick={() => login("management")} className="bg-yellow-500 px-6 py-3 rounded-xl">إدارة</button>
        <button onClick={() => login("executive")} className="bg-red-500 px-6 py-3 rounded-xl">مدير تنفيذي</button>
      </div>
    </div>
  )
}
