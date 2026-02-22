import { NextResponse } from "next/server"
import OpenAI from "openai"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"

function tokenSimilarity(a: string, b: string) {
  const sa = new Set(a.toLowerCase().split(/\s+/).filter(Boolean))
  const sb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean))
  if (sa.size === 0 || sb.size === 0) return 0
  let intersection = 0
  sa.forEach((t) => {
    if (sb.has(t)) intersection += 1
  })
  return Math.round((intersection / Math.max(sa.size, sb.size)) * 100)
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { data: idea, error: ideaErr } = await supabaseAdmin
      .from("ideas")
      .select("id,title,description,problem_statement,proposed_solution,expected_impact,potential_risks,maturity_level,idea_quality_score")
      .eq("id", id)
      .single()

    if (ideaErr) return NextResponse.json({ error: ideaErr.message }, { status: 500 })

    const { data: allIdeas, error: allErr } = await supabaseAdmin
      .from("ideas")
      .select("id,title,description")
      .neq("id", id)
      .limit(200)

    if (allErr) return NextResponse.json({ error: allErr.message }, { status: 500 })

    const baseText = `${idea.title || ""} ${idea.description || ""} ${idea.problem_statement || ""} ${idea.proposed_solution || ""}`

    const similarIdeas = (allIdeas || [])
      .map((row) => ({
        id: row.id,
        title: row.title,
        similarity: tokenSimilarity(baseText, `${row.title || ""} ${row.description || ""}`),
      }))
      .filter((row) => row.similarity > 20)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)

    const heuristicQuality = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (idea.title ? 15 : 0) +
            ((idea.problem_statement || "").length > 40 ? 20 : 8) +
            ((idea.proposed_solution || "").length > 40 ? 20 : 8) +
            ((idea.expected_impact || "").length > 20 ? 15 : 5) +
            ((idea.potential_risks || "").length > 10 ? 10 : 4) +
            (idea.maturity_level === "prototype" ? 20 : idea.maturity_level === "concept" ? 12 : 6)
        )
      )
    )

    const riskAlerts = [
      "مخاطر تكامل الأنظمة.",
      "مخاطر توفر البيانات وجودتها.",
      "مخاطر تبني المستخدم النهائي.",
    ]

    const improvements = [
      "تعزيز خط الأساس الرقمي للمشكلة قبل التحكيم.",
      "ربط الأثر المتوقع بمؤشرات قياس شهرية.",
      "توضيح خطة التنفيذ المرحلية ومسؤوليات الفريق.",
    ]

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        mode: "fallback",
        data: {
          analysis: `تحليل مختصر: الفكرة في مستوى ${idea.maturity_level || "idea"} وتحتاج توثيق أثر أدق قبل التحكيم البشري.`,
          riskAlerts,
          improvements,
          ideaQualityScore: Number(idea.idea_quality_score || heuristicQuality),
          similarIdeas,
        },
      })
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
            "أنت محلل أفكار ابتكارية. أعد JSON بالمفاتيح: analysis,riskAlerts,improvements,ideaQualityScore. بالعربية ومختصر.",
        },
        {
          role: "user",
          content: `عنوان: ${idea.title}\nوصف: ${idea.description || ""}\nمشكلة: ${idea.problem_statement || ""}\nحل: ${idea.proposed_solution || ""}\nأثر متوقع: ${idea.expected_impact || ""}\nمخاطر: ${idea.potential_risks || ""}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || "{}"
    const parsed = JSON.parse(raw)

    return NextResponse.json({
      mode: "live",
      data: {
        analysis: parsed.analysis || "",
        riskAlerts: parsed.riskAlerts || riskAlerts,
        improvements: parsed.improvements || improvements,
        ideaQualityScore: Math.max(0, Math.min(100, Number(parsed.ideaQualityScore || heuristicQuality))),
        similarIdeas,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to build idea insights" }, { status: 500 })
  }
}
