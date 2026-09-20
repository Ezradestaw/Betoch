import { query } from '../database/db.js';

export interface AuditLogEntry {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        entry.actorId || null,
        entry.action,
        entry.resourceType,
        entry.resourceId,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null
      ]
    );
  } catch (err) {
    console.error('[Audit Logger Failure]', err);
    // Never crash the primary business transaction if audit writing fails, but log aggressively
  }
}
