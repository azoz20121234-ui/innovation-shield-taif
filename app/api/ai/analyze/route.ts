import { NextResponse } from "next/server"
import OpenAI from "openai"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"

type AnalysisPayload = {
  idea: string
  mode?: "beginner" | "advanced"
  auto?: boolean
  ideaId?: string | null
}

function baseQuality(idea: string, mode: "beginner" | "advanced") {
  const len = idea.trim().length
  const base = len > 240 ? 78 : len > 140 ? 68 : len > 80 ? 58 : 45
  return Math.max(0, Math.min(100, base + (mode === "advanced" ? 8 : 0)))
}

function fallbackAnalysis(idea: string, mode: "beginner" | "advanced") {
  const label = idea.split("\n")[0]?.trim().slice(0, 70) || "الفكرة المقترحة"
  const qualityScore = baseQuality(idea, mode)

  return {
    mode: "fallback",
    summary: `الفكرة "${label}" واعدة وتحتاج تجهيزات واضحة قبل التحكيم والتنفيذ.`,
    pitch:
      "مبادرة ابتكارية لتحسين جودة الخدمة وتسريع الإجراءات الصحية عبر حل قابل للتوسع ومدعوم بقياس أثر.",
    feasibility: mode === "beginner"
      ? [
          "الجدوى: مناسبة للبدء كنموذج أولي صغير.",
          "ركّز على مشكلة واحدة قابلة للقياس.",
          "ابدأ بفريق صغير وخطة اختبار قصيرة.",
        ]
      : [
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
    qualityAssessment: {
      ideaQualityScore: qualityScore,
      readinessLevel: qualityScore >= 75 ? "جاهزة للتحكيم" : qualityScore >= 55 ? "تحتاج تحسين" : "تحتاج إعادة صياغة",
      aiSuccessPrediction: Math.max(0, Math.min(100, qualityScore - 5)),
    },
    routing: {
      recommendedNextStep: qualityScore >= 75 ? "judging" : "refine",
      judgingReady: qualityScore >= 75,
      executionReady: qualityScore >= 85,
      links: {
        judging: "/dashboard/judging",
        execution: "/dashboard/projects",
        refine: "/dashboard/new-idea",
      },
    },
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalysisPayload
    const idea = body.idea?.trim()
    const mode = body.mode === "advanced" ? "advanced" : "beginner"

    if (!idea) {
      return NextResponse.json({ error: "يرجى إدخال فكرة للتحليل." }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      const fallback = fallbackAnalysis(idea, mode)
      await supabaseAdmin.from("ai_assist_logs").insert({
        idea_id: body.ideaId || null,
        step: `analyze_${mode}${body.auto ? "_auto" : ""}`,
        prompt: idea,
        response: fallback,
      })
      return NextResponse.json(fallback)
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
            "أنت مساعد ابتكار حكومي لمنصة تجمع الطائف الصحي. أعد JSON فقط بالمفاتيح: summary,pitch,feasibility,prototypeOutputs,riskScan,duplicationScan,ipGuidance,gapAnalysis,prototypeAssistant,advancedImpact,teamAssistant,qualityAssessment,routing. القيم بالعربية وبشكل عملي. qualityAssessment يحتوي ideaQualityScore,readinessLevel,aiSuccessPrediction. routing يحتوي recommendedNextStep,judgingReady,executionReady,links{judging,execution,refine}.",
        },
        {
          role: "user",
          content:
            `وضع التحليل: ${mode}\n` +
            `حلل هذه الفكرة:\n${idea}\n` +
            "أضف تحليل فجوات، مساعد نموذج أولي، تحليل أثر متقدم، مساعد فريق، تقييم جودة شامل، وتوصية مسار (تحكيم/تنفيذ/تحسين).",
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    const parsed = raw ? JSON.parse(raw) : fallbackAnalysis(idea, mode)

    await supabaseAdmin.from("ai_assist_logs").insert({
      idea_id: body.ideaId || null,
      step: `analyze_${mode}${body.auto ? "_auto" : ""}`,
      prompt: idea,
      response: parsed,
    })

    return NextResponse.json({ mode: "live", ...parsed })
  } catch {
    return NextResponse.json(
      { error: "تعذر تنفيذ التحليل الآن. حاول مرة أخرى." },
      { status: 500 }
    )
  }
}
