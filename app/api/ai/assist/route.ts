import { NextResponse } from "next/server"
import OpenAI from "openai"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

const schemaHint =
  "Return JSON object with keys: summary,improvements,impactAnalysis,prototypeHints,riskAlerts,presentationDraft,gapAnalysis,prototypeAssistant,advancedImpact,teamAssistant"

function fallbackPayload() {
  return {
    summary: "صياغة أولية للفكرة قابلة للتطوير.",
    improvements: ["وضح المشكلة", "أضف baseline", "حدد KPI"],
    impactAnalysis: ["تأثير متوقع على الزمن", "تقليل الهدر"],
    prototypeHints: ["شاشة إدخال", "لوحة متابعة"],
    riskAlerts: ["خصوصية", "تكامل"],
    presentationDraft: "مسودة عرض مختصرة للمبادرة.",
    gapAnalysis: {
      existing: ["وصف مبدئي للفكرة", "هدف تشغيلي عام"],
      missing: ["بيانات خط الأساس", "مقاييس أثر قابلة للقياس"],
      beforeJudging: ["إضافة نموذج أولي", "خطة تنفيذ أولية"],
    },
    prototypeAssistant: {
      userFlow: ["تسجيل الدخول", "اختيار الخدمة", "تنفيذ الطلب", "متابعة الحالة"],
      journeyMap: ["اكتشاف الخدمة", "تقديم الطلب", "استلام النتيجة"],
      useScenarios: ["مريض جديد", "طبيب محول", "موظف تشغيل"],
      apiBlueprint: ["POST /ideas", "GET /ideas/:id", "POST /judging"],
    },
    advancedImpact: {
      financialSavings: "تقدير أولي: خفض 10-15% من تكلفة الإجراء المستهدف.",
      qualityImprovement: "تحسين الالتزام بالإجراءات وتقليل الأخطاء المتكررة.",
      patientExperienceImprovement: "تقليل زمن الانتظار وتحسين وضوح رحلة المريض.",
      similarProjectsComparison: "مشابه لمبادرات تحسين المواعيد، ويتفوق بربط التنفيذ بالتحكيم.",
    },
    teamAssistant: {
      taskDistribution: ["محلل بيانات: baseline", "قائد فريق: خطة التنفيذ", "مصمم: نموذج أولي"],
      rolesSuggestion: ["قائد مبادرة", "مالك منتج", "ممثل سريري", "ممثل تشغيلي"],
      readyUpdates: ["تم استكمال تحليل الفجوات", "جاري بناء النموذج الأولي", "المخاطر التشغيلية تحت المراجعة"],
      operationalRisks: ["تأخر موافقات", "نقص بيانات", "ضغط تشغيلي على الفريق"],
    },
  }
}

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
      const fallback = fallbackPayload()

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
            "You are an innovation consultant for Taif Health Cluster. Return practical Arabic output. " +
            schemaHint,
        },
        {
          role: "user",
          content:
            `step:${step}\n` +
            `${prompt}\n` +
            "Include gap analysis (existing/missing/beforeJudging), prototype assistant (userFlow/journeyMap/useScenarios/apiBlueprint), advanced impact (financialSavings/qualityImprovement/patientExperienceImprovement/similarProjectsComparison), and team assistant (taskDistribution/rolesSuggestion/readyUpdates/operationalRisks).",
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
