"use client"

import { useEffect, useMemo, useState } from "react"
import { getNextSuggestedState, stateTransitions } from "@/lib/workflow/stateMachine"

type Idea = {
  id: string
  title: string
  description: string | null
  challenge_id: string | null
  state: string
  final_judging_score?: number | null
  created_at: string
}

type Challenge = {
  id: string
  title: string
}

const stateLabels: Record<string, string> = {
  idea_submitted: "طرح الفكرة",
  ai_refined: "تحسين AI",
  team_formed: "تشكيل الفريق",
  prototype_ready: "النموذج الأولي",
  ai_judged: "تحكيم AI",
  human_judged: "تحكيم بشري",
  approved_for_execution: "اعتماد التنفيذ",
  execution_in_progress: "تنفيذ",
  impact_tracking: "قياس أثر",
  protected_published: "حماية ونشر",
  rejected: "مرفوض",
}

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [assistantLoading, setAssistantLoading] = useState<string | null>(null)
  const [assistantOutput, setAssistantOutput] = useState<Record<string, string>>({})

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [challengeId, setChallengeId] = useState("")

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const [ideasRes, challengesRes] = await Promise.all([
        fetch("/api/ideas"),
        fetch("/api/challenges"),
      ])

      const ideasJson = await ideasRes.json()
      const challengesJson = await challengesRes.json()

      if (!ideasRes.ok) throw new Error(ideasJson.error || "تعذر تحميل الأفكار")
      if (!challengesRes.ok) throw new Error(challengesJson.error || "تعذر تحميل التحديات")

      setIdeas(ideasJson.data || [])
      setChallenges(challengesJson.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const challengeName = useMemo(() => {
    const m = new Map<string, string>()
    challenges.forEach((c) => m.set(c.id, c.title))
    return m
  }, [challenges])

  const createIdea = async () => {
    if (!title.trim()) return
    setSaving(true)

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          challengeId: challengeId || null,
          ownerId: "employee",
          ownerName: "مبتكر",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء الفكرة")

      setTitle("")
      setDescription("")
      setChallengeId("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSaving(false)
    }
  }

  const transition = async (idea: Idea, toState: string) => {
    try {
      const res = await fetch(`/api/ideas/${idea.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toState,
          actorId: "workflow-admin",
          actorRole: "management",
          action: "IDEA_STATE_UPDATED",
          notes: `Manual transition to ${toState}`,
          pmName: "PMO Team",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Transition failed")

      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    }
  }

  const askAssistant = async (idea: Idea) => {
    setAssistantLoading(idea.id)
    try {
      const step = idea.state
      const prompt = `الفكرة: ${idea.title}\nالوصف: ${idea.description || "لا يوجد"}\nالمرحلة الحالية: ${step}\nقدم توصيات فورية للفريق.`
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, step, prompt }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "AI assist failed")

      const payload = json.data || {}
      const text = [
        `ملخص: ${payload.summary || "-"}`,
        `تحسينات: ${(payload.improvements || []).join(" | ")}`,
        `المخاطر: ${(payload.riskAlerts || []).join(" | ")}`,
        `محتوى العرض: ${payload.presentationDraft || "-"}`,
      ].join("\n")

      setAssistantOutput((prev) => ({ ...prev, [idea.id]: text }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setAssistantLoading(null)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">إدارة الأفكار (State Machine)</h1>
        <p className="mt-2 text-sm text-slate-300">
          كل فكرة تمر بمراحل ثابتة، وكل انتقال يُسجل تلقائيًا في audit log وidea_state_events.
        </p>
      </section>

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="text-xl font-semibold text-slate-100">إضافة فكرة</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان الفكرة"
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />

          <select
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          >
            <option value="">بدون ربط تحدي</option>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف الفكرة"
            className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-slate-100"
          />
        </div>

        <button
          onClick={createIdea}
          disabled={saving}
          className="mt-4 rounded-2xl bg-sky-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "جارٍ الإنشاء..." : "إنشاء فكرة"}
        </button>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}

      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">الأفكار الحالية</h2>

        {loading ? (
          <p className="text-slate-300">جارٍ التحميل...</p>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea) => {
              const suggested = getNextSuggestedState(idea.state)
              const transitions = stateTransitions[idea.state as keyof typeof stateTransitions] || []

              return (
                <div key={idea.id} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-100">{idea.title}</h3>
                    <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-300">
                      {stateLabels[idea.state] || idea.state}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-300">{idea.description || "بدون وصف"}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    التحدي: {idea.challenge_id ? challengeName.get(idea.challenge_id) || "غير معروف" : "غير مرتبط"}
                  </p>
                  {idea.final_judging_score !== null && idea.final_judging_score !== undefined && (
                    <p className="mt-1 text-xs text-slate-400">متوسط التحكيم: {idea.final_judging_score}</p>
                  )}

                  {transitions.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {transitions.map((next) => (
                        <button
                          key={next}
                          onClick={() => transition(idea, next)}
                          className={`rounded-xl px-3 py-1.5 text-xs ${
                            suggested === next
                              ? "bg-sky-600 text-white"
                              : "border border-slate-600 bg-slate-900/80 text-slate-200"
                          }`}
                        >
                          انتقال إلى: {stateLabels[next] || next}
                        </button>
                      ))}
                      <button
                        onClick={() => askAssistant(idea)}
                        className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs text-violet-200"
                      >
                        {assistantLoading === idea.id ? "AI..." : "مساعد AI"}
                      </button>
                    </div>
                  )}

                  {assistantOutput[idea.id] && (
                    <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-100">
                      {assistantOutput[idea.id]}
                    </pre>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
