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

/**
 * Get novels from user's library that have new chapters since follow date
 */
export async function getLibraryUpdates(limit: number = 5) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return { novels: [], total: 0 };
    }

    try {
        // Get library entries with novels that have chapters newer than follow date
        const libraryWithUpdates = await db.library.findMany({
            where: { userId: session.user.id },
            include: {
                novel: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        coverImage: true,
                        volumes: {
                            select: {
                                chapters: {
                                    where: { isDraft: false },
                                    orderBy: { createdAt: "desc" },
                                    take: 1,
                                    select: {
                                        id: true,
                                        title: true,
                                        slug: true,
                                        createdAt: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Filter novels with chapters newer than follow date
        const novelsWithUpdates = libraryWithUpdates
            .map((lib) => {
                const allChapters = lib.novel.volumes.flatMap((v) => v.chapters);
                const latestChapter = allChapters[0];

                // Count chapters since follow
                const newChaptersCount = allChapters.filter(
                    (ch) => new Date(ch.createdAt) > new Date(lib.createdAt)
                ).length;

                if (!latestChapter || newChaptersCount === 0) return null;

                return {
                    novelId: lib.novel.id,
                    title: lib.novel.title,
                    slug: lib.novel.slug,
                    coverImage: lib.novel.coverImage,
                    latestChapter: {
                        id: latestChapter.id,
                        title: latestChapter.title,
                        slug: latestChapter.slug,
                    },
                    newChaptersCount,
                    followedAt: lib.createdAt,
                };
            })
            .filter((n): n is NonNullable<typeof n> => n !== null);

        return {
            novels: novelsWithUpdates.slice(0, limit),
            total: novelsWithUpdates.length,
        };
    } catch (error) {
        console.error("Error fetching library updates:", error);
        return { novels: [], total: 0 };
    }
}

/**
 * Get count of novels with updates for badge
 */
export async function getLibraryUpdateCount() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return 0;
    }

    try {
        const libraryWithUpdates = await db.library.findMany({
            where: { userId: session.user.id },
            include: {
                novel: {
                    select: {
                        volumes: {
                            select: {
                                chapters: {
                                    where: { isDraft: false },
                                    select: { createdAt: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Count novels that have at least one chapter newer than follow date
        let count = 0;
        for (const lib of libraryWithUpdates) {
            const hasNewChapters = lib.novel.volumes.some((v) =>
                v.chapters.some((ch) => new Date(ch.createdAt) > new Date(lib.createdAt))
            );
            if (hasNewChapters) count++;
        }

        return count;
    } catch (error) {
        console.error("Error getting library update count:", error);
        return 0;
    }
}
