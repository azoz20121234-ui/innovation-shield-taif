import { NextResponse } from "next/server"
import OpenAI from "openai"

type AssistInput = {
  title?: string
  problemStatement?: string
  proposedSolution?: string
  addedValue?: string
  targetAudience?: string
  expectedImpact?: string
  potentialRisks?: string
  maturityLevel?: string
  selfClarity?: number
  selfReadiness?: number
  selfFeasibility?: number
}

function scoreByHeuristic(input: AssistInput) {
  const textFields = [
    input.title,
    input.problemStatement,
    input.proposedSolution,
    input.addedValue,
    input.targetAudience,
    input.expectedImpact,
    input.potentialRisks,
  ]

  let score = 0
  textFields.forEach((field) => {
    if ((field || "").trim().length >= 20) score += 10
    else if ((field || "").trim().length >= 8) score += 6
    else if ((field || "").trim().length > 0) score += 3
  })

  const selfAvg = Math.round((Number(input.selfClarity || 0) + Number(input.selfReadiness || 0) + Number(input.selfFeasibility || 0)) / 3)
  score += Math.round(selfAvg * 0.3)

  return Math.max(0, Math.min(100, score))
}

function fallback(input: AssistInput) {
  const suggestedTitle = input.title?.trim() || "حل ابتكاري لتحسين رحلة الخدمة الصحية"
  const refinedProblem = input.problemStatement?.trim() || "يوجد تأخر وتباين في معالجة الطلبات الصحية مما يؤثر على الجودة والزمن."
  const refinedSolution = input.proposedSolution?.trim() || "منصة رقمية تربط الفرق والتحديات وتسرّع التحكيم والتنفيذ بقياس أثر مستمر."

  const qualityScore = scoreByHeuristic(input)

  return {
    suggestedTitle,
    refinedDescription: `${refinedProblem} الحل المقترح: ${refinedSolution}`,
    valueAnalysis: [
      "تقليل الهدر التشغيلي وتحسين الكفاءة.",
      "رفع سرعة اتخاذ القرار عبر بيانات قابلة للقياس.",
      "تحسين تجربة المريض وجودة الخدمة.",
    ],
    riskScan: [
      "مخاطر تكامل الأنظمة القائمة.",
      "مخاطر جودة البيانات المتاحة.",
      "مخاطر تبني المستخدمين للحل الجديد.",
    ],
    impactKpis: [
      "زمن الانتقال من الفكرة إلى التنفيذ",
      "نسبة الأفكار المقبولة للتحكيم",
      "معدل التحسن في رضا المستفيد",
    ],
    qualityScore,
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AssistInput

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ mode: "fallback", data: fallback(body) })
    }

    const client = new OpenAI({ apiKey })
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "أنت مساعد صياغة فكرة ابتكارية. أعد JSON فقط بالمفاتيح: suggestedTitle,refinedDescription,valueAnalysis,riskScan,impactKpis,qualityScore. اللغة عربية.",
        },
        {
          role: "user",
          content: `\nالعنوان: ${body.title || ""}\nالمشكلة: ${body.problemStatement || ""}\nالحل: ${body.proposedSolution || ""}\nالقيمة: ${body.addedValue || ""}\nالفئة: ${body.targetAudience || ""}\nالأثر: ${body.expectedImpact || ""}\nالمخاطر: ${body.potentialRisks || ""}\nالنضج: ${body.maturityLevel || "idea"}\nالتقييم الذاتي: وضوح ${body.selfClarity || 0} / جاهزية ${body.selfReadiness || 0} / قابلية ${body.selfFeasibility || 0}\nقم بتحسين الصياغة واقتراح مؤشرات أثر وتقييم جودة الفكرة من 0-100.`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return NextResponse.json({ mode: "fallback", data: fallback(body) })
    }

    const parsed = JSON.parse(raw)
    const safeScore = Math.max(0, Math.min(100, Number(parsed.qualityScore || scoreByHeuristic(body))))

    return NextResponse.json({
      mode: "live",
      data: {
        suggestedTitle: parsed.suggestedTitle || body.title || "",
        refinedDescription: parsed.refinedDescription || "",
        valueAnalysis: parsed.valueAnalysis || [],
        riskScan: parsed.riskScan || [],
        impactKpis: parsed.impactKpis || [],
        qualityScore: safeScore,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to generate idea assistance" }, { status: 500 })
  }
}
