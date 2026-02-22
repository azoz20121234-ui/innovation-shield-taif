import { supabaseAdmin } from "@/lib/server/supabaseAdmin"

export async function logAudit(params: {
  userId?: string
  action: string
  entity: string
  entityId?: string
  metadata?: Record<string, unknown>
}) {
  await supabaseAdmin.from("audit_logs").insert({
    user_id: params.userId || "system",
    action: params.action,
    entity: params.entity,
    entity_id: params.entityId || null,
    metadata: params.metadata || {},
  })
}
