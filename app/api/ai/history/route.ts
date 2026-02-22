import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 12)))

    const { data, error } = await supabaseAdmin
      .from("ai_assist_logs")
      .select("id,idea_id,step,prompt,response,created_at")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: data || [] })
  } catch {
    return NextResponse.json({ error: "Failed to load AI history" }, { status: 500 })
  }
}
