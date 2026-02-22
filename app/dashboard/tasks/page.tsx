"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type TaskStatus = "todo" | "inprogress" | "done"

type TaskRecord = {
  id: string
  title: string
  status: TaskStatus
}

export default function TasksPage() {

  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [title, setTitle] = useState("")

  const loadTasks = async () => {
    const { data } = await supabase.from("tasks").select("*")
    if (data) setTasks(data as TaskRecord[])
  }

  useEffect(() => {
    const fetchInitialTasks = async () => {
      const { data } = await supabase.from("tasks").select("*")
      if (data) setTasks(data as TaskRecord[])
    }

    void fetchInitialTasks()
  }, [])

  const createTask = async () => {
    if (!title.trim()) return

    await supabase.from("tasks").insert([{ title }])
    setTitle("")
    await loadTasks()
  }

  const updateStatus = async (id: string, status: TaskStatus) => {
    await supabase.from("tasks").update({ status }).eq("id", id)
    await loadTasks()
  }

  const renderColumn = (status: TaskStatus, titleLabel: string) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-1/3">
      <h3 className="mb-4 font-semibold">{titleLabel}</h3>
      {tasks.filter(t => t.status === status).map(task => (
        <div
          key={task.id}
          className="p-3 mb-3 rounded-xl bg-white/10 cursor-pointer"
          onClick={() => {
            const next =
              status === "todo"
                ? "inprogress"
                : status === "inprogress"
                ? "done"
                : "todo"
            updateStatus(task.id, next)
          }}
        >
          {task.title}
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-10">

      <h1 className="text-4xl font-semibold">
        لوحة المهام
      </h1>

      <div className="flex gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان المهمة"
          className="p-3 rounded-xl bg-white/10 border border-white/10"
        />
        <button
          onClick={createTask}
          className="px-6 py-3 bg-purple-500 rounded-xl"
        >
          إضافة مهمة
        </button>
      </div>

      <div className="flex gap-6">
        {renderColumn("todo", "To Do")}
        {renderColumn("inprogress", "In Progress")}
        {renderColumn("done", "Done")}
      </div>

    </div>
  )
}
