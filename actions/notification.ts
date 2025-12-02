"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Get user's notifications (paginated)
 */
export async function getNotifications(page: number = 1, limit: number = 15) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { notifications: [], hasMore: false, total: 0 };
    }

    try {
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            db.notification.findMany({
                where: { userId: session.user.id },
                include: {
                    actor: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            image: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip,
            }),
            db.notification.count({
                where: { userId: session.user.id },
            }),
        ]);

        return {
            notifications,
            hasMore: skip + limit < total,
            total,
        };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return { notifications: [], hasMore: false, total: 0 };
    }
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return 0;
    }

    try {
        const count = await db.notification.count({
            where: {
                userId: session.user.id,
                isRead: false,
            },
        });
        return count;
    } catch (error) {
        console.error("Error getting unread count:", error);
        return 0;
    }
}

/**
 * Mark a specific notification as read
 */
export async function markAsRead(notificationId: string) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.notification.update({
            where: {
                id: notificationId,
                userId: session.user.id, // Ensure user owns this notification
            },
            data: { isRead: true },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { error: "Failed to mark notification as read" };
    }
}

/**
 * Mark all user notifications as read
 */
export async function markAllAsRead() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { error: "Unauthorized" };
    }

    try {
        await db.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error marking all as read:", error);
        return { error: "Failed to mark all as read" };
    }
}

/**
 * Internal helper to create notification (not exported as server action)
 */
export async function createNotification(data: {
    userId: string;
    actorId?: string;
    type: string;
    resourceId: string;
    resourceType: string;
    message: string;
}) {
    try {
        await db.notification.create({
            data: {
                userId: data.userId,
                actorId: data.actorId,
                type: data.type,
                resourceId: data.resourceId,
                resourceType: data.resourceType,
                message: data.message,
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating notification:", error);
        return { error: "Failed to create notification" };
    }
}
