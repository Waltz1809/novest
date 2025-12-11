import { db } from "@/lib/db";

/**
 * Log admin action - for use in API routes
 * Does NOT check auth (caller is responsible for auth check)
 */
export async function logAdminActionDirect(
    userId: string,
    action: string,
    targetId?: string,
    targetType?: string,
    details?: string
) {
    try {
        await db.adminLog.create({
            data: {
                action,
                targetId,
                targetType,
                details,
                userId,
            },
        });
    } catch (error) {
        console.error("Failed to log admin action:", error);
    }
}
