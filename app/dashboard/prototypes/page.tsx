"use client"

import { useEffect, useMemo, useState } from "react"
import { useDemoRole } from "@/lib/auth/useDemoRole"

type PrototypeIdea = {
  id: string
  title: string
  description: string | null
  state: string
  ai_prototype_hint: string | null
  updated_at: string
}

const stateLabels: Record<string, string> = {
  ai_refined: "جاهزة لتشكيل فريق",
  team_formed: "جاهزة لبناء النموذج",
  prototype_ready: "جاهزة للتحكيم",
}

export default function PrototypesPage() {
  const { capabilities } = useDemoRole()
  const canManageExecution = capabilities.canManageExecution
  const canTransitionIdeas = capabilities.canTransitionIdeas
  const canUseAiAssistant = capabilities.canUseAiAssistant
  const [items, setItems] = useState<PrototypeIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [aiOutput, setAiOutput] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/prototypes")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحميل النماذج الأولية")

      const rows = json.data || []
      setItems(rows)

      const initial: Record<string, string> = {}
      rows.forEach((row: PrototypeIdea) => {
        initial[row.id] = row.ai_prototype_hint || ""
      })
      setNotes(initial)
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const summary = useMemo(() => {
    return {
      total: items.length,
      formed: items.filter((item) => item.state === "team_formed").length,
      ready: items.filter((item) => item.state === "prototype_ready").length,
    }
  }, [items])

  const savePrototype = async (item: PrototypeIdea) => {
    if (!canManageExecution) return
    setSavingId(item.id)
    setError(null)

    try {
      const res = await fetch("/api/prototypes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: item.id,
          prototypeHint: notes[item.id] || null,
          actorId: "team-lead",
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر حفظ الملاحظات")

      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSavingId(null)
    }
  }

  const moveState = async (item: PrototypeIdea, nextState: string) => {
    if (!canTransitionIdeas) return
    setSavingId(item.id)
    setError(null)

    try {
      const res = await fetch(`/api/ideas/${item.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toState: nextState,
          actorId: "prototype-team",
          actorRole: "team",
          action: "PROTOTYPE_STATE_UPDATED",
          notes: `Moved to ${nextState} from prototypes board`,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر تحديث المرحلة")

      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSavingId(null)
    }
  }

  const generateAiPrototype = async (item: PrototypeIdea) => {
    if (!canUseAiAssistant) return
    setSavingId(item.id)
    setError(null)

    try {
      const prompt = `الفكرة: ${item.title}\nالوصف: ${item.description || "لا يوجد"}\nأنشئ تصورًا للنموذج الأولي: شاشة رئيسية، رحلة مستخدم، عناصر اختبار مبدئي.`

      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: item.id, step: "prototype_ready", prompt }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "تعذر توليد مخرجات AI")

      const payload = json.data || {}
      const output = [
        `ملخص: ${payload.summary || "-"}`,
        `سيناريوهات مقترحة: ${(payload.improvements || []).join(" | ")}`,
        `تنبيهات مخاطر: ${(payload.riskAlerts || []).join(" | ")}`,
      ].join("\n")

      setAiOutput((prev) => ({ ...prev, [item.id]: output }))
      setNotes((prev) => ({ ...prev, [item.id]: payload.presentationDraft || prev[item.id] || "" }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-3xl border border-white/20 bg-slate-900/55 p-6">
        <h1 className="text-3xl font-semibold text-slate-100">لوحة النماذج الأولية</h1>
        <p className="mt-2 text-sm text-slate-300">
          إدارة بناء النموذج الأولي، حفظ المخرجات، والانتقال من تشكيل الفريق إلى جاهزية التحكيم.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">إجمالي الأفكار</p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">مرحلة بناء النموذج</p>
          <p className="mt-1 text-2xl font-semibold text-violet-300">{summary.formed}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
          <p className="text-xs text-slate-400">جاهزة للتحكيم</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.ready}</p>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{error}</div>}
      {!canManageExecution && !canTransitionIdeas && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          وضع القراءة فقط: حفظ مخرجات النموذج أو تغيير المرحلة متاح حسب الدور.
        </div>
      )}

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-300">جارٍ التحميل...</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4 text-slate-300">
            لا توجد أفكار حالية في مسار النموذج الأولي.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-900/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-100">{item.title}</h2>
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-300">
                  {stateLabels[item.state] || item.state}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-300">{item.description || "بدون وصف"}</p>

              <textarea
                value={notes[item.id] || ""}
                onChange={(e) =>
                  setNotes((prev) => ({
                    ...prev,
                    [item.id]: e.target.value,
                  }))
                }
                disabled={!canManageExecution}
                placeholder="ملاحظات النموذج الأولي / رابط Figma / سيناريو اختبار"
                className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-100 disabled:opacity-60"
                rows={4}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => savePrototype(item)}
                  disabled={savingId === item.id || !canManageExecution}
                  className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                >
                  حفظ الملاحظات
                </button>

                <button
                  onClick={() => generateAiPrototype(item)}
                  disabled={savingId === item.id || !canUseAiAssistant}
                  className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs text-violet-200 disabled:opacity-50"
                >
                  توليد اقتراح AI
                </button>

                {item.state === "ai_refined" && (
                  <button
                    onClick={() => moveState(item, "team_formed")}
                    disabled={savingId === item.id || !canTransitionIdeas}
                    className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs text-cyan-200 disabled:opacity-50"
                  >
                    تشكيل فريق
                  </button>
                )}

                {item.state === "team_formed" && (
                  <button
                    onClick={() => moveState(item, "prototype_ready")}
                    disabled={savingId === item.id || !canTransitionIdeas}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200 disabled:opacity-50"
                  >
                    إعلان جاهزية النموذج
                  </button>
                )}
              </div>

              {aiOutput[item.id] && (
                <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-100">
                  {aiOutput[item.id]}
                </pre>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  )
}
