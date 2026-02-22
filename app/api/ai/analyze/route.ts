import { NextResponse } from "next/server"
import OpenAI from "openai"

type AnalysisPayload = {
  idea: string
}

function fallbackAnalysis(idea: string) {
  const label = idea.split("\n")[0]?.trim().slice(0, 70) || "الفكرة المقترحة"

  return {
    mode: "fallback",
    summary: `الفكرة "${label}" واعدة وتحتاج تجهيزات واضحة قبل التحكيم والتنفيذ.`,
    pitch:
      "مبادرة ابتكارية لتحسين جودة الخدمة وتسريع الإجراءات الصحية عبر حل قابل للتوسع ومدعوم بقياس أثر.",
    feasibility: [
      "الجدوى: مناسب للبدء ضمن نطاق MVP خلال 6-8 أسابيع.",
      "الأثر: متوقع تحسين زمن الإجراء وتقليل الهدر.",
      "المتطلبات: فريق متعدد التخصصات ومالك مبادرة واضح.",
    ],
    prototypeOutputs: [
      "Wireframe للشاشة الرئيسية.",
      "User Flow كامل من الطلب حتى الإغلاق.",
      "Journey Map للمريض/الموظف.",
      "API Blueprint مبدئي للتكامل.",
    ],
    riskScan: [
      "مخاطر خصوصية البيانات.",
      "مخاطر تكامل الأنظمة.",
      "مخاطر تبني المستخدمين.",
    ],
    duplicationScan: [
      "مراجعة داخلية مطلوبة ضد مبادرات مشابهة.",
      "مقارنة خارجية قبل الاعتماد النهائي.",
    ],
    ipGuidance: [
      "توصية مبدئية: حماية حق مؤلف + أسرار تجارية.",
      "توثيق النسخ والتحديثات والاختبارات.",
      "تجهيز مسودة ملف رفع حماية الملكية.",
    ],
    gapAnalysis: {
      existing: ["فكرة أساسية", "هدف تشغيلي"],
      missing: ["Baseline رقمي", "خطة اختبار", "معايير نجاح مفصلة"],
      beforeJudging: ["اكتمال النموذج الأولي", "تحليل مخاطر موثق", "خطة تنفيذ 90 يوم"],
    },
    prototypeAssistant: {
      userFlow: ["تسجيل الحالة", "تحليل AI", "قرار التحكيم", "متابعة التنفيذ"],
      journeyMap: ["المشكلة", "التقديم", "التجربة", "القياس"],
      useScenarios: ["سيناريو سريري", "سيناريو تشغيلي", "سيناريو إداري"],
      apiBlueprint: ["POST /ideas", "POST /ai/assist", "POST /judging", "PATCH /projects"],
    },
    advancedImpact: {
      financialSavings: "تقدير أولي: خفض 12% من تكاليف المعالجة المستهدفة.",
      qualityImprovement: "تحسين جودة الالتزام وتقليل التباين في الخدمة.",
      patientExperienceImprovement: "تقليل زمن الانتظار وتحسين الوضوح للمريض.",
      similarProjectsComparison: "أثر أعلى من المشاريع التقليدية بسبب دمج AI والتحكيم المرحلي.",
    },
    teamAssistant: {
      taskDistribution: ["PM: خطة التنفيذ", "Data: baseline/impact", "Clinical: validation", "Tech: prototype"],
      rolesSuggestion: ["قائد مبادرة", "مُمثل سريري", "مُمثل تشغيلي", "محلل بيانات", "مهندس تقني"],
      readyUpdates: ["اكتمل تحليل الفجوات", "تم بناء User Flow", "جاري التحضير للتحكيم"],
      operationalRisks: ["تعارض أولويات", "نقص بيانات", "اعتماد متأخر"],
    },
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
            "أنت مساعد ابتكار حكومي لمنصة تجمع الطائف الصحي. أعد JSON فقط بالمفاتيح: summary,pitch,feasibility,prototypeOutputs,riskScan,duplicationScan,ipGuidance,gapAnalysis,prototypeAssistant,advancedImpact,teamAssistant. القيم بالعربية وبشكل عملي.",
        },
        {
          role: "user",
          content:
            `حلل هذه الفكرة:\n${idea}\n` +
            "أضف تحليل فجوات (الموجود/الناقص/قبل التحكيم)، مساعد نموذج أولي (User Flow/Journey Map/سيناريوهات/API Blueprint)، تحليل أثر متقدم (وفورات مالية/تحسين الجودة/تجربة المريض/مقارنة مشابهة)، ومساعد فريق (توزيع مهام/أدوار/تحديثات جاهزة/مخاطر تشغيلية).",
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
