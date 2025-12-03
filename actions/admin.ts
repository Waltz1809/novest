"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Helper to check admin role
async function checkAdmin() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }
    return session;
}

/**
 * Get paginated users with search
 */
export async function getUsers({
    page = 1,
    limit = 10,
    search = "",
}: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    await checkAdmin();

    const skip = (page - 1) * limit;

    try {
        const where = search
            ? {
                OR: [
                    { name: { contains: search } },
                    { email: { contains: search } },
                    { nickname: { contains: search } },
                    { username: { contains: search } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    nickname: true,
                    username: true,
                    createdAt: true,
                    isBanned: true,
                    _count: {
                        select: { comments: true },
                    },
                },
            }),
            db.user.count({ where }),
        ]);

        return {
            users,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Get users error:", error);
        return { error: "Failed to fetch users" };
    }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
    await checkAdmin();

    try {
        await db.user.delete({
            where: { id: userId },
        });

        revalidatePath("/admin/users");
        return { success: "User deleted successfully" };
    } catch (error) {
        console.error("Delete user error:", error);
        return { error: "Failed to delete user" };
    }
}

/**
 * Get paginated comments with search
 */
export async function getComments({
    page = 1,
    limit = 10,
    search = "",
}: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    await checkAdmin();

    const skip = (page - 1) * limit;

    try {
        const where = search
            ? {
                content: { contains: search },
            }
            : {};

        const [comments, total] = await Promise.all([
            db.comment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                            nickname: true,
                        },
                    },
                    novel: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    chapter: {
                        select: {
                            id: true,
                            title: true,
                            volume: {
                                select: {
                                    order: true,
                                },
                            },
                        },
                    },
                },
            }),
            db.comment.count({ where }),
        ]);

        return {
            comments,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Get comments error:", error);
        return { error: "Failed to fetch comments" };
    }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: number) {
    await checkAdmin();

    try {
        await db.comment.delete({
            where: { id: commentId },
        });

        revalidatePath("/admin/comments");
        return { success: "Comment deleted successfully" };
    } catch (error) {
        console.error("Delete comment error:", error);
        return { error: "Failed to delete comment" };
    }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: string) {
    await checkAdmin();

    try {
        await db.user.update({
            where: { id: userId },
            data: { role },
        });

        revalidatePath("/admin/users");
        return { success: "User role updated successfully" };
    } catch (error) {
        console.error("Update role error:", error);
        return { error: "Failed to update user role" };
    }
}

/**
 * Ban user
 */
export async function banUser(userId: string, reason: string) {
    await checkAdmin();

    try {
        await db.user.update({
            where: { id: userId },
            data: {
                isBanned: true,
                banReason: reason,
            },
        });

        revalidatePath("/admin/users");
        return { success: "User banned successfully" };
    } catch (error) {
        console.error("Ban user error:", error);
        return { error: "Failed to ban user" };
    }
}

/**
 * Get paginated novels with search
 */
export async function getNovels({
    page = 1,
    limit = 10,
    search = "",
}: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    await checkAdmin();

    const skip = (page - 1) * limit;

    try {
        const where = search
            ? {
                title: { contains: search },
            }
            : {};

        const [novels, total] = await Promise.all([
            db.novel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    uploader: {
                        select: {
                            name: true,
                            nickname: true,
                        },
                    },
                    _count: {
                        select: {
                            comments: true,
                        },
                    },
                },
            }),
            db.novel.count({ where }),
        ]);

        return {
            novels,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Get novels error:", error);
        return { error: "Failed to fetch novels" };
    }
}

/**
 * Delete a novel
 */
export async function deleteNovel(novelId: number) {
    await checkAdmin();

    try {
        await db.novel.delete({
            where: { id: novelId },
        });

        revalidatePath("/admin/novels");
        return { success: "Novel deleted successfully" };
    } catch (error) {
        console.error("Delete novel error:", error);
        return { error: "Failed to delete novel" };
    }
}

/**
 * Get paginated tickets
 */
export async function getTickets({
    page = 1,
    limit = 10,
    status = "",
}: {
    page?: number;
    limit?: number;
    status?: string;
}) {
    await checkAdmin();

    const skip = (page - 1) * limit;

    try {
        const where = status ? { status } : {};

        const [tickets, total] = await Promise.all([
            db.ticket.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
            }),
            db.ticket.count({ where }),
        ]);

        return {
            tickets,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Get tickets error:", error);
        return { error: "Failed to fetch tickets" };
    }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketId: string, status: string) {
    await checkAdmin();

    try {
        await db.ticket.update({
            where: { id: ticketId },
            data: { status },
        });

        revalidatePath("/admin/tickets");
        return { success: "Ticket status updated successfully" };
    } catch (error) {
        console.error("Update ticket error:", error);
        return { error: "Failed to update ticket status" };
    }
}

/**
 * Get admin dashboard stats
 */
export async function getAdminStats() {
    await checkAdmin();

    try {
        const [totalUsers, totalComments, totalNovels, openTickets] = await Promise.all([
            db.user.count(),
            db.comment.count(),
            db.novel.count(),
            db.ticket.count({ where: { status: "OPEN" } }),
        ]);

        return {
            totalUsers,
            totalComments,
            totalNovels,
            openTickets,
        };
    } catch (error) {
        console.error("Get stats error:", error);
        return { error: "Failed to fetch stats" };
    }
}
