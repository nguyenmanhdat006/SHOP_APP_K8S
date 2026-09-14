import { prismaWrite } from "../config/prisma.js";

export const logAudit = async ({
  requestId,
  actorId = null,
  actorRole = null,
  action,
  targetType = null,
  targetId = null,
  result = "success",
  clientIp = null,
  detail = null,
}) => {
  try {
    await prismaWrite.$queryRaw`
      INSERT INTO audit_events
        (request_id, actor_id, actor_role, action, target_type, target_id, result, client_ip, detail)
      VALUES
        (${requestId}, ${actorId}, ${actorRole}, ${action}, ${targetType},
         ${targetId ? String(targetId) : null}, ${result}, ${clientIp},
         ${detail ? JSON.stringify(detail) : null}::jsonb)
    `;
  } catch (err) {
    console.error("audit log failed:", err);
  }
};

export const auditContext = (req) => ({
  requestId: req?.requestId,
  actorId: req?.user?.id ?? null,
  actorRole: req?.user?.role ?? null,
  clientIp: req?.ip ?? null,
});