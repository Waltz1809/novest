"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { toSlug } from "@/lib/utils";

/**
 * Create a new genre (Admin only)
 */
export async function createGenre(name: string) {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MODERATOR"].includes(session.user.role as string)) {
        return { error: "Không có quyền thực hiện" };
    }

    if (!name || name.trim().length < 2) {
        return { error: "Tên thể loại phải có ít nhất 2 ký tự" };
    }

    const slug = toSlug(name);

    // Check if genre already exists
    const existing = await db.genre.findFirst({
        where: {
            OR: [
                { name: name.trim() },
                { slug }
            ]
        }
    });

    if (existing) {
        return { error: "Thể loại này đã tồn tại" };
    }

    try {
        const genre = await db.genre.create({
            data: {
                name: name.trim(),
                slug,
            },
        });

        revalidatePath("/admin/genres");
        revalidatePath("/studio/novels/create");

        return { success: "Đã tạo thể loại mới", genre };
    } catch (error) {
        console.error("Create genre error:", error);
        return { error: "Lỗi khi tạo thể loại" };
    }
}

/**
 * Update a genre (Admin only)
 */
export async function updateGenre(id: number, name: string) {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MODERATOR"].includes(session.user.role as string)) {
        return { error: "Không có quyền thực hiện" };
    }

    if (!name || name.trim().length < 2) {
        return { error: "Tên thể loại phải có ít nhất 2 ký tự" };
    }

    const slug = toSlug(name);

    // Check if another genre with same name/slug exists
    const existing = await db.genre.findFirst({
        where: {
            AND: [
                { id: { not: id } },
                {
                    OR: [
                        { name: name.trim() },
                        { slug }
                    ]
                }
            ]
        }
    });

    if (existing) {
        return { error: "Thể loại này đã tồn tại" };
    }

    try {
        const genre = await db.genre.update({
            where: { id },
            data: {
                name: name.trim(),
                slug,
            },
        });

        revalidatePath("/admin/genres");
        revalidatePath("/studio/novels/create");

        return { success: "Đã cập nhật thể loại", genre };
    } catch (error) {
        console.error("Update genre error:", error);
        return { error: "Lỗi khi cập nhật thể loại" };
    }
}

/**
 * Delete a genre (Admin only)
 */
export async function deleteGenre(id: number) {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MODERATOR"].includes(session.user.role as string)) {
        return { error: "Không có quyền thực hiện" };
    }

    try {
        // Check how many novels use this genre
        const genre = await db.genre.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { novels: true }
                }
            }
        });

        if (!genre) {
            return { error: "Không tìm thấy thể loại" };
        }

        if (genre._count.novels > 0) {
            return { error: `Không thể xóa - có ${genre._count.novels} truyện đang dùng thể loại này` };
        }

        await db.genre.delete({
            where: { id },
        });

        revalidatePath("/admin/genres");
        revalidatePath("/studio/novels/create");

        return { success: "Đã xóa thể loại" };
    } catch (error) {
        console.error("Delete genre error:", error);
        return { error: "Lỗi khi xóa thể loại" };
    }
}

/**
 * Get all genres with novel count (Admin)
 */
export async function getGenresWithCount() {
    const genres = await db.genre.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: { novels: true }
            }
        }
    });
    return genres;
}
