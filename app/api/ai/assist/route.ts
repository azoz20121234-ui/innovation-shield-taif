import { NextResponse } from "next/server"
import OpenAI from "openai"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

const schemaHint =
  "Return JSON object with keys: summary, improvements, impactAnalysis, prototypeHints, riskAlerts, presentationDraft"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ideaId = body.ideaId || null
    const step = body.step || "general"
    const prompt = String(body.prompt || "")

    if (!prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      const fallback = {
        summary: "صياغة أولية للفكرة قابلة للتطوير.",
        improvements: ["وضح المشكلة", "أضف baseline", "حدد KPI"],
        impactAnalysis: ["تأثير متوقع على الزمن", "تقليل الهدر"],
        prototypeHints: ["شاشة إدخال", "لوحة متابعة"],
        riskAlerts: ["خصوصية", "تكامل"],
        presentationDraft: "مسودة عرض مختصرة للمبادرة.",
      }

      if (ideaId) {
        await supabaseAdmin.from("ai_assist_logs").insert({
          idea_id: ideaId,
          step,
          prompt,
          response: fallback,
        })
      }

      return NextResponse.json({ mode: "fallback", data: fallback })
    }

    const client = new OpenAI({ apiKey })

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an innovation copilot for Taif Health Cluster. Keep outputs practical and concise in Arabic. " +
            schemaHint,
        },
        {
          role: "user",
          content: `step:${step}\n${prompt}`,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content || "{}"
    const parsed = JSON.parse(text)

    if (ideaId) {
      await supabaseAdmin.from("ai_assist_logs").insert({
        idea_id: ideaId,
        step,
        prompt,
        response: parsed,
      })
    }

    await logAudit({
      action: "AI_ASSIST_USED",
      entity: "idea",
      entityId: ideaId || undefined,
      metadata: { step },
    })

    return NextResponse.json({ mode: "live", data: parsed })
  } catch {
    return NextResponse.json({ error: "AI assist failed" }, { status: 500 })
  }
}
