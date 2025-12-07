"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Helper to check admin role
async function checkAdmin() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MODERATOR") {
        throw new Error("Unauthorized");
    }
    return session;
}

/**
 * Get the currently active announcement for display
 */
export async function getActiveAnnouncement() {
    try {
        const now = new Date();

        const announcement = await db.announcement.findFirst({
            where: {
                isActive: true,
                startDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            },
            orderBy: { createdAt: "desc" }
        });

        return { announcement };
    } catch (error) {
        console.error("Get active announcement error:", error);
        return { error: "Failed to fetch announcement" };
    }
}

/**
 * Get all announcements for admin
 */
export async function getAllAnnouncements() {
    await checkAdmin();

    try {
        const announcements = await db.announcement.findMany({
            orderBy: { createdAt: "desc" }
        });

        return { announcements };
    } catch (error) {
        console.error("Get announcements error:", error);
        return { error: "Failed to fetch announcements" };
    }
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(data: {
    title: string;
    content: string;
    startDate?: Date;
    endDate?: Date | null;
}) {
    await checkAdmin();

    try {
        const announcement = await db.announcement.create({
            data: {
                title: data.title,
                content: data.content,
                startDate: data.startDate || new Date(),
                endDate: data.endDate || null,
                isActive: true,
            }
        });

        revalidatePath("/admin/announcements");
        return { success: "Đã tạo thông báo!", announcement };
    } catch (error) {
        console.error("Create announcement error:", error);
        return { error: "Không thể tạo thông báo" };
    }
}

/**
 * Update an announcement
 */
export async function updateAnnouncement(id: string, data: {
    title?: string;
    content?: string;
    startDate?: Date;
    endDate?: Date | null;
    isActive?: boolean;
}) {
    await checkAdmin();

    try {
        const announcement = await db.announcement.update({
            where: { id },
            data
        });

        revalidatePath("/admin/announcements");
        return { success: "Đã cập nhật thông báo!", announcement };
    } catch (error) {
        console.error("Update announcement error:", error);
        return { error: "Không thể cập nhật thông báo" };
    }
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string) {
    await checkAdmin();

    try {
        await db.announcement.delete({
            where: { id }
        });

        revalidatePath("/admin/announcements");
        return { success: "Đã xóa thông báo!" };
    } catch (error) {
        console.error("Delete announcement error:", error);
        return { error: "Không thể xóa thông báo" };
    }
}

/**
 * Toggle announcement active status
 */
export async function toggleAnnouncement(id: string) {
    await checkAdmin();

    try {
        const current = await db.announcement.findUnique({ where: { id } });
        if (!current) {
            return { error: "Không tìm thấy thông báo" };
        }

        const announcement = await db.announcement.update({
            where: { id },
            data: { isActive: !current.isActive }
        });

        revalidatePath("/admin/announcements");
        return {
            success: announcement.isActive ? "Đã bật thông báo!" : "Đã tắt thông báo!",
            announcement
        };
    } catch (error) {
        console.error("Toggle announcement error:", error);
        return { error: "Không thể thay đổi trạng thái" };
    }
}
