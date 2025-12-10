"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"

// Helper to check admin/mod access
async function checkAdminOrMod() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
        throw new Error("Insufficient permissions")
    }
    return session.user
}

// Log admin action
export async function logAdminAction(
    action: string,
    targetId?: string,
    targetType?: string,
    details?: string
) {
    const user = await checkAdminOrMod()

    await db.adminLog.create({
        data: {
            action,
            targetId,
            targetType,
            details,
            userId: user.id,
        }
    })
}

// Get admin logs with pagination and filters
export async function getAdminLogs({
    page = 1,
    limit = 20,
    action = "",
    userId = "",
}: {
    page?: number
    limit?: number
    action?: string
    userId?: string
}) {
    await checkAdminOrMod()

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {}
    if (action) {
        where.action = action
    }
    if (userId) {
        where.userId = userId
    }

    const [logs, total] = await Promise.all([
        db.adminLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        username: true,
                        image: true,
                        role: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        db.adminLog.count({ where }),
    ])

    return {
        logs,
        metadata: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }
}

// Get all unique action types for filter dropdown
export async function getLogActionTypes() {
    await checkAdminOrMod()

    const actions = await db.adminLog.findMany({
        select: { action: true },
        distinct: ['action'],
    })

    return actions.map(a => a.action)
}
