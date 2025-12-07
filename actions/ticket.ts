"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TICKET_STATUSES, TICKET_STATUS_LABELS } from "@/lib/ticket-types";

// Validation schema
const createTicketSchema = z.object({
    mainType: z.string(),
    subType: z.string().optional(),
    title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự").max(200),
    description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự").max(5000),
    chapterId: z.number().optional(),
    novelId: z.number().optional(),
});

/**
 * Create a new ticket
 */
export async function createTicket(data: z.infer<typeof createTicketSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    const validatedFields = createTicketSchema.safeParse(data);
    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message };
    }

    const { mainType, subType, title, description, chapterId, novelId } = validatedFields.data;

    try {
        const ticket = await db.ticket.create({
            data: {
                userId: session.user.id,
                mainType,
                subType,
                title,
                description,
                chapterId,
                novelId,
                status: "OPEN",
            },
        });

        revalidatePath("/admin/tickets");
        revalidatePath("/studio/tickets");

        return { success: "Ticket đã được gửi thành công", ticketId: ticket.id };
    } catch (error) {
        console.error("Create ticket error:", error);
        return { error: "Lỗi khi tạo ticket" };
    }
}

/**
 * Get user's tickets
 */
export async function getUserTickets() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const tickets = await db.ticket.findMany({
            where: { userId: session.user.id },
            include: {
                novel: {
                    select: { id: true, title: true, slug: true },
                },
                chapter: {
                    select: { id: true, title: true, slug: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return { tickets };
    } catch (error) {
        console.error("Get user tickets error:", error);
        return { error: "Lỗi khi tải tickets" };
    }
}

/**
 * Get all tickets (admin only)
 */
export async function getAllTickets(status?: string, mainType?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    if (!isAdmin) {
        return { error: "Không có quyền truy cập" };
    }

    try {
        const where: any = {};
        if (status) where.status = status;
        if (mainType) where.mainType = mainType;

        const tickets = await db.ticket.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, username: true, image: true },
                },
                novel: {
                    select: { id: true, title: true, slug: true },
                },
                chapter: {
                    select: { id: true, title: true, slug: true },
                },
            },
            orderBy: [
                { status: "asc" }, // OPEN first
                { createdAt: "desc" },
            ],
        });

        return { tickets };
    } catch (error) {
        console.error("Get all tickets error:", error);
        return { error: "Lỗi khi tải tickets" };
    }
}

/**
 * Get a specific ticket
 */
export async function getTicket(ticketId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const ticket = await db.ticket.findUnique({
            where: { id: ticketId },
            include: {
                user: {
                    select: { id: true, name: true, username: true, image: true },
                },
                novel: {
                    select: { id: true, title: true, slug: true, coverImage: true },
                },
                chapter: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        volume: {
                            select: { novelId: true }
                        }
                    },
                },
            },
        });

        if (!ticket) {
            return { error: "Không tìm thấy ticket" };
        }

        // Check access: owner or admin
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        if (!isAdmin && ticket.userId !== session.user.id) {
            return { error: "Không có quyền xem ticket này" };
        }

        return { ticket };
    } catch (error) {
        console.error("Get ticket error:", error);
        return { error: "Lỗi khi tải ticket" };
    }
}

/**
 * Update ticket status (admin only)
 */
export async function updateTicketStatus(ticketId: string, status: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    if (!isAdmin) {
        return { error: "Không có quyền thực hiện" };
    }

    if (!Object.keys(TICKET_STATUSES).includes(status)) {
        return { error: "Trạng thái không hợp lệ" };
    }

    try {
        const ticket = await db.ticket.update({
            where: { id: ticketId },
            data: { status },
            include: {
                user: { select: { id: true } },
            },
        });

        // Send notification to ticket owner
        const { createNotification } = await import("./notification");
        await createNotification({
            userId: ticket.userId,
            actorId: session.user.id,
            type: "TICKET_UPDATE",
            resourceId: ticketId,
            resourceType: "TICKET",
            message: `Ticket "${ticket.title}" đã được cập nhật: ${TICKET_STATUS_LABELS[status]}`,
        });

        revalidatePath("/admin/tickets");
        revalidatePath("/studio/tickets");

        return { success: `Đã cập nhật trạng thái thành ${TICKET_STATUS_LABELS[status]}` };
    } catch (error) {
        console.error("Update ticket status error:", error);
        return { error: "Lỗi khi cập nhật trạng thái" };
    }
}

/**
 * Close a ticket (owner or admin)
 */
export async function closeTicket(ticketId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const ticket = await db.ticket.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            return { error: "Không tìm thấy ticket" };
        }

        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isOwner = ticket.userId === session.user.id;

        if (!isAdmin && !isOwner) {
            return { error: "Không có quyền thực hiện" };
        }

        await db.ticket.update({
            where: { id: ticketId },
            data: { status: "CLOSED" },
        });

        revalidatePath("/admin/tickets");
        revalidatePath("/studio/tickets");

        return { success: "Đã đóng ticket" };
    } catch (error) {
        console.error("Close ticket error:", error);
        return { error: "Lỗi khi đóng ticket" };
    }
}

/**
 * Get ticket counts by status (admin dashboard)
 */
export async function getTicketCounts() {
    const session = await auth();
    if (!session?.user?.id) {
        return { open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 };
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    if (!isAdmin) {
        return { open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 };
    }

    try {
        const [open, inProgress, resolved, closed] = await Promise.all([
            db.ticket.count({ where: { status: "OPEN" } }),
            db.ticket.count({ where: { status: "IN_PROGRESS" } }),
            db.ticket.count({ where: { status: "RESOLVED" } }),
            db.ticket.count({ where: { status: "CLOSED" } }),
        ]);

        return {
            open,
            inProgress,
            resolved,
            closed,
            total: open + inProgress + resolved + closed,
        };
    } catch (error) {
        console.error("Get ticket counts error:", error);
        return { open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 };
    }
}
