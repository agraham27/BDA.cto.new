import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';

export interface AuditEvent {
  userId?: string | null;
  action: string;
  entity?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function serializeMetadata(metadata?: Record<string, unknown>): Prisma.JsonValue | undefined {
  if (!metadata) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(metadata)) as Prisma.JsonValue;
  } catch (error) {
    logger.warn('Failed to serialize audit metadata', error);
    return undefined;
  }
}

export const auditLogger = {
  async log(event: AuditEvent): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: event.action,
          entity: event.entity,
          userId: event.userId ?? null,
          metadata: serializeMetadata(event.metadata),
          ipAddress: event.ipAddress ?? undefined,
          userAgent: event.userAgent ?? undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to record audit event', error);
    }
  },
};
