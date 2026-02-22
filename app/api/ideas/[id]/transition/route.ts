import { NextResponse } from "next/server"
import { applyIdeaTransition } from "@/lib/workflow/engine"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const result = await applyIdeaTransition({
      ideaId: id,
      toState: body.toState,
      actorId: body.actorId || "system",
      actorRole: body.actorRole || "system",
      notes: body.notes,
      action: body.action || "IDEA_STATE_UPDATED",
      autoCreateProject: true,
      pmName: body.pmName,
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transition failed" },
      { status: 400 }
    )
  }
}
