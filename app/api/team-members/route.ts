import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/server/supabaseAdmin"
import { logAudit } from "@/lib/workflow/audit"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.teamId || !body.memberName) {
      return NextResponse.json({ error: "teamId and memberName are required" }, { status: 400 })
    }

    const requestedRole = String(body.role || "").toLowerCase()
    if (requestedRole === "leader") {
      const { data: existingLeader, error: leaderErr } = await supabaseAdmin
        .from("team_members")
        .select("id")
        .eq("team_id", body.teamId)
        .ilike("role", "leader")
        .maybeSingle()

      if (leaderErr) return NextResponse.json({ error: leaderErr.message }, { status: 500 })
      if (existingLeader) {
        return NextResponse.json({ error: "يوجد قائد حالي للفريق، يجب استبداله أولاً" }, { status: 400 })
      }
    }

    const { data, error } = await supabaseAdmin
      .from("team_members")
      .insert({
        team_id: body.teamId,
        member_id: body.memberId || null,
        member_name: body.memberName,
        role: body.role || null,
      })
      .select("id,team_id,member_name,role")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "TEAM_MEMBER_ADDED",
      entity: "team",
      entityId: body.teamId,
      metadata: { memberName: data.member_name, role: data.role },
    })

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()

    if (!body.memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 })
    }

    const { data: member, error: memberErr } = await supabaseAdmin
      .from("team_members")
      .select("id,team_id,member_name,role")
      .eq("id", body.memberId)
      .single()

    if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 })

    if (String(member.role || "").toLowerCase() === "leader") {
      return NextResponse.json({ error: "لا يمكن حذف القائد مباشرة، قم بتعيين قائد بديل أولاً" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("team_members")
      .delete()
      .eq("id", body.memberId)
      .select("id,team_id,member_name,role")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "TEAM_MEMBER_REMOVED",
      entity: "team",
      entityId: data.team_id,
      metadata: { memberName: data.member_name, role: data.role },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
  }
}
