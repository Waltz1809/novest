"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logAdminAction } from "./admin-log";

// Helper to check admin or moderator role
async function checkAdmin() {
    const session = await auth();
    const isAdminOrMod = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";
    if (!isAdminOrMod) {
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

// Roles assignable via dashboard (ADMIN can only be assigned via database directly)
const VALID_ROLES = ['MODERATOR', 'READER'] as const;
type ValidRole = typeof VALID_ROLES[number];

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
        // Get comment details for logging
        const comment = await db.comment.findUnique({
            where: { id: commentId },
            select: { content: true, userId: true }
        });

        await db.comment.delete({
            where: { id: commentId },
        });

        // Log admin action
        if (comment) {
            await logAdminAction(
                "DELETE_COMMENT",
                String(commentId),
                "COMMENT",
                `Xóa bình luận: "${comment.content.substring(0, 50)}..."`
            );
        }

        revalidatePath("/admin/comments");
        return { success: "Comment deleted successfully" };
    } catch (error) {
        console.error("Delete comment error:", error);
        return { error: "Failed to delete comment" };
    }
}

/**
 * Update user role
 * Note: User needs to re-login to see the new role (JWT caching)
 */
export async function updateUserRole(userId: string, role: string) {
    await checkAdmin();

    // Validate role
    if (!VALID_ROLES.includes(role as ValidRole)) {
        return { error: "Vai trò không hợp lệ" };
    }

    try {
        await db.user.update({
            where: { id: userId },
            data: { role },
        });

        revalidatePath("/admin/users");
        return { success: "Đã cập nhật vai trò. Người dùng cần đăng nhập lại để thấy thay đổi." };
    } catch (error) {
        console.error("Update role error:", error);
        return { error: "Lỗi khi cập nhật vai trò" };
    }
}

/**
 * Ban user (soft ban - user can't login but account remains)
 * ADMIN can ban anyone except other ADMINs
 * MODERATOR can only ban READERs
 */
export async function banUser(userId: string, reason: string) {
    const session = await auth();
    const currentRole = session?.user?.role;

    // Only ADMIN or MODERATOR can ban
    if (!currentRole || (currentRole !== "ADMIN" && currentRole !== "MODERATOR")) {
        return { error: "Không có quyền thực hiện" };
    }

    try {
        // Get target user's role
        const targetUser = await db.user.findUnique({
            where: { id: userId },
            select: { role: true, name: true }
        });

        if (!targetUser) {
            return { error: "Không tìm thấy người dùng" };
        }

        // ADMIN cannot be banned
        if (targetUser.role === "ADMIN") {
            return { error: "Không thể cấm Admin" };
        }

        // MODERATOR can only ban READER
        if (currentRole === "MODERATOR" && targetUser.role !== "READER") {
            return { error: "Moderator chỉ có thể cấm người dùng thường" };
        }

        await db.user.update({
            where: { id: userId },
            data: {
                isBanned: true,
                banReason: reason || "Vi phạm quy định",
            },
        });

        // Log admin action
        await logAdminAction(
            "BAN_USER",
            userId,
            "USER",
            `Cấm người dùng "${targetUser.name || 'Unknown'}". Lý do: ${reason || "Vi phạm quy định"}`
        );

        revalidatePath("/admin/users");
        return { success: "Đã cấm người dùng" };
    } catch (error) {
        console.error("Ban user error:", error);
        return { error: "Lỗi khi cấm người dùng" };
    }
}

/**
 * Unban user
 * ADMIN can unban anyone
 * MODERATOR can only unban READERs
 */
export async function unbanUser(userId: string) {
    const session = await auth();
    const currentRole = session?.user?.role;

    // Only ADMIN or MODERATOR can unban
    if (!currentRole || (currentRole !== "ADMIN" && currentRole !== "MODERATOR")) {
        return { error: "Không có quyền thực hiện" };
    }

    try {
        // Get target user's role
        const targetUser = await db.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (!targetUser) {
            return { error: "Không tìm thấy người dùng" };
        }

        // MODERATOR can only unban READER
        if (currentRole === "MODERATOR" && targetUser.role !== "READER") {
            return { error: "Moderator chỉ có thể bỏ cấm người dùng thường" };
        }

        await db.user.update({
            where: { id: userId },
            data: {
                isBanned: false,
                banReason: null,
            },
        });

        // Log admin action
        await logAdminAction(
            "UNBAN_USER",
            userId,
            "USER",
            `Bỏ cấm người dùng`
        );

        revalidatePath("/admin/users");
        return { success: "Đã bỏ cấm người dùng" };
    } catch (error) {
        console.error("Unban user error:", error);
        return { error: "Lỗi khi bỏ cấm người dùng" };
    }
}

/**
 * Get paginated novels with search and status filter
 */
export async function getNovels({
    page = 1,
    limit = 10,
    search = "",
    status = "", // PENDING, APPROVED, REJECTED, or "" for all
}: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}) {
    await checkAdmin();

    const skip = (page - 1) * limit;

    try {
        // Build where clause with optional search and status
        const where: Record<string, unknown> = {};

        if (search) {
            where.title = { contains: search };
        }

        if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
            where.approvalStatus = status;
        }

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
 * Soft delete a novel (hide instead of deleting to avoid FK issues)
 */
export async function deleteNovel(novelId: number) {
    await checkAdmin();

    try {
        // Get novel details for logging
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: { title: true }
        });

        // Soft delete: set approval status to prevent visibility
        await db.novel.update({
            where: { id: novelId },
            data: {
                approvalStatus: "REJECTED",
                rejectionReason: "Đã bị xóa bởi quản trị viên"
            },
        });

        // Log admin action
        if (novel) {
            await logAdminAction(
                "DELETE_NOVEL",
                String(novelId),
                "NOVEL",
                `Ẩn truyện "${novel.title}"`
            );
        }

        revalidatePath("/admin/novels");
        return { success: "Đã ẩn truyện thành công" };
    } catch (error) {
        console.error("Delete novel error:", error);
        return { error: "Lỗi khi ẩn truyện" };
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
