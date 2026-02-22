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

    const insertWithMemberName = () =>
      supabaseAdmin
        .from("team_members")
        .insert({
          team_id: body.teamId,
          member_id: body.memberId || null,
          member_name: body.memberName,
          role: body.role || null,
        })
        .select("id,team_id,member_name,role")
        .single()

    const insertWithName = () =>
      supabaseAdmin
        .from("team_members")
        .insert({
          team_id: body.teamId,
          member_id: body.memberId || null,
          name: body.memberName,
          role: body.role || null,
        })
        .select("id,team_id,name,role")
        .single()

    const result = await insertWithMemberName()
    let data: { member_name?: string; name?: string; role?: string | null } | null = result.data
    let error = result.error
    if (error && /member_name/i.test(error.message || "")) {
      const retry = await insertWithName()
      data = retry.data
      error = retry.error
    }

    if (error || !data) return NextResponse.json({ error: error?.message || "Failed to add team member" }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "TEAM_MEMBER_ADDED",
      entity: "team",
      entityId: body.teamId,
      metadata: { memberName: data.member_name || data.name, role: data.role },
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

    const getMemberWithMemberName = () =>
      supabaseAdmin
        .from("team_members")
        .select("id,team_id,member_name,role")
        .eq("id", body.memberId)
        .single()

    const getMemberWithName = () =>
      supabaseAdmin
        .from("team_members")
        .select("id,team_id,name,role")
        .eq("id", body.memberId)
        .single()

    const memberResult = await getMemberWithMemberName()
    let member: { role?: string | null } | null = memberResult.data
    let memberErr = memberResult.error
    if (memberErr && /member_name/i.test(memberErr.message || "")) {
      const retry = await getMemberWithName()
      member = retry.data
      memberErr = retry.error
    }

    if (memberErr || !member) {
      return NextResponse.json({ error: memberErr?.message || "Failed to load team member" }, { status: 500 })
    }

    if (String(member.role || "").toLowerCase() === "leader") {
      return NextResponse.json({ error: "لا يمكن حذف القائد مباشرة، قم بتعيين قائد بديل أولاً" }, { status: 400 })
    }

    const deleteWithMemberName = () =>
      supabaseAdmin
        .from("team_members")
        .delete()
        .eq("id", body.memberId)
        .select("id,team_id,member_name,role")
        .single()

    const deleteWithName = () =>
      supabaseAdmin
        .from("team_members")
        .delete()
        .eq("id", body.memberId)
        .select("id,team_id,name,role")
        .single()

    const deleteResult = await deleteWithMemberName()
    let data: { team_id?: string; member_name?: string; name?: string; role?: string | null } | null =
      deleteResult.data
    let error = deleteResult.error
    if (error && /member_name/i.test(error.message || "")) {
      const retry = await deleteWithName()
      data = retry.data
      error = retry.error
    }

    if (error || !data) return NextResponse.json({ error: error?.message || "Failed to remove team member" }, { status: 500 })

    await logAudit({
      userId: body.actorId || "system",
      action: "TEAM_MEMBER_REMOVED",
      entity: "team",
      entityId: data.team_id,
      metadata: { memberName: data.member_name || data.name, role: data.role },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
  }
}
