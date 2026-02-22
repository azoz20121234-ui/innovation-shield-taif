import { NextResponse } from "next/server"
import OpenAI from "openai"

type AnalysisPayload = {
  idea: string
}

function fallbackAnalysis(idea: string) {
  const label = idea.split("\n")[0]?.trim().slice(0, 70) || "الفكرة المقترحة"

  return {
    mode: "fallback",
    summary: `الفكرة "${label}" تبدو واعدة وتحتاج ربطًا مباشرًا بمؤشرات أثر تشغيلية وسريرية واضحة.`,
    pitch:
      "مبادرة ابتكارية لتحسين جودة الخدمة وتسريع الإجراءات الصحية عبر حل قابل للتوسع ومدعوم بقياس أثر.",
    feasibility: [
      "الجدوى: مناسب للبدء ضمن نطاق MVP خلال 6-8 أسابيع.",
      "الأثر: متوقع تحسين زمن الإجراء وتقليل الهدر.",
      "المتطلبات: فريق متعدد التخصصات ومالك مبادرة واضح.",
    ],
    prototypeOutputs: [
      "Wireframe للشاشة الرئيسية للحل.",
      "سيناريو استخدام قبل/بعد التغيير.",
      "نموذج اختبار مبكر مع مستخدمين داخليين.",
    ],
    riskScan: [
      "مخاطر خصوصية البيانات الحساسة.",
      "مخاطر تكامل مع الأنظمة الحالية.",
      "مخاطر تبني المستخدمين للتغيير.",
    ],
    duplicationScan: [
      "مراجعة داخلية مطلوبة ضد مبادرات مشابهة سابقة.",
      "يوصى بمقارنة خارجية قبل الاعتماد النهائي.",
    ],
    ipGuidance: [
      "توصية مبدئية: حماية حق مؤلف + توثيق الأسرار التجارية.",
      "توثيق جميع النسخ والتحديثات والاختبارات.",
      "تجهيز مسودة ملف رفع حماية الملكية.",
    ],
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalysisPayload
    const idea = body.idea?.trim()

    if (!idea) {
      return NextResponse.json({ error: "يرجى إدخال فكرة للتحليل." }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(fallbackAnalysis(idea))
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
            "أنت مساعد ابتكار حكومي لمنصة تجمع الطائف الصحي. أعد الناتج JSON فقط بالمفاتيح: summary,pitch,feasibility,prototypeOutputs,riskScan,duplicationScan,ipGuidance. اجعل القيم باللغة العربية وبشكل عملي ومختصر.",
        },
        {
          role: "user",
          content: `حلل هذه الفكرة:\n${idea}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return NextResponse.json(fallbackAnalysis(idea))
    }

    const parsed = JSON.parse(raw)
    return NextResponse.json({ mode: "live", ...parsed })
  } catch {
    return NextResponse.json(
      { error: "تعذر تنفيذ التحليل الآن. حاول مرة أخرى." },
      { status: 500 }
    )
  }
}

