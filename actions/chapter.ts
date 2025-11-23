"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const chapterSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    content: z.string().min(1, "Nội dung không được để trống"),
    volumeId: z.coerce.number().min(1, "Vui lòng chọn tập"),
    order: z.coerce.number().min(1, "Vui lòng nhập số thứ tự"),
    price: z.coerce.number().min(0).default(0),
    isLocked: z.boolean().default(false),
});

export async function getNovels() {
    try {
        const novels = await db.novel.findMany({
            select: {
                id: true,
                title: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return novels;
    } catch (error) {
        return [];
    }
}

export async function getVolumes(novelId: number) {
    try {
        const volumes = await db.volume.findMany({
            where: {
                novelId: novelId,
            },
            select: {
                id: true,
                title: true,
                order: true,
            },
            orderBy: {
                order: "asc",
            },
        });
        return volumes;
    } catch (error) {
        return [];
    }
}

export async function createChapter(data: z.infer<typeof chapterSchema>) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        return { error: "Unauthorized" };
    }

    const validatedFields = chapterSchema.safeParse(data);

    if (!validatedFields.success) {
        return { error: "Dữ liệu không hợp lệ" };
    }

    const { title, content, volumeId, order, price, isLocked } = validatedFields.data;

    try {
        // Fetch volume to get novel slug and volume order for slug generation
        const volume = await db.volume.findUnique({
            where: { id: volumeId },
            include: { novel: true },
        });

        if (!volume) {
            return { error: "Volume not found" };
        }

        // New Slug Logic: vol-{volumeOrder}-chap-{order}
        const slug = `vol-${volume.order}-chap-${order}`;

        // Check for duplicate slug
        const existingSlug = await db.chapter.findFirst({
            where: {
                slug,
                volume: {
                    novelId: volume.novelId
                }
            }
        });

        if (existingSlug) {
            return { error: "Chapter with this order already exists in this volume (Slug conflict)" };
        }

        await db.chapter.create({
            data: {
                title,
                content,
                volumeId,
                order,
                price,
                isLocked,
                slug,
            },
        });

        revalidatePath(`/dashboard/novels/edit/${volume.novelId}`);
        revalidatePath(`/truyen/${volume.novel.slug}`);
        return { success: "Tạo chương thành công!" };
    } catch (error) {
        console.error("Create chapter error:", error);
        return { error: "Có lỗi xảy ra khi tạo chương" };
    }
}

export async function updateChapter(chapterId: number, data: z.infer<typeof chapterSchema>) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        return { error: "Unauthorized" };
    }

    const validatedFields = chapterSchema.safeParse(data);

    if (!validatedFields.success) {
        return { error: "Dữ liệu không hợp lệ" };
    }

    const { title, content, volumeId, order, price, isLocked } = validatedFields.data;

    try {
        const existingChapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: { volume: { include: { novel: true } } }
        });

        if (!existingChapter) return { error: "Chapter not found" };

        // Only regenerate slug if volume or order changed
        let slug = existingChapter.slug;
        if (existingChapter.volumeId !== volumeId || existingChapter.order !== order) {
            const volume = await db.volume.findUnique({ where: { id: volumeId } });
            if (!volume) return { error: "Volume not found" };
            slug = `vol-${volume.order}-chap-${order}`;
        }

        await db.chapter.update({
            where: { id: chapterId },
            data: {
                title,
                content,
                volumeId,
                order,
                price,
                isLocked,
                slug,
            },
        });

        revalidatePath(`/dashboard/novels/edit/${existingChapter.volume.novelId}`);
        revalidatePath(`/truyen/${existingChapter.volume.novel.slug}`);
        revalidatePath(`/truyen/${existingChapter.volume.novel.slug}/${slug}`);

        return { success: "Cập nhật chương thành công!" };
    } catch (error) {
        console.error("Update chapter error:", error);
        return { error: "Có lỗi xảy ra khi cập nhật chương" };
    }
}

export async function deleteChapter(chapterId: number) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        throw new Error("Unauthorized");
    }

    try {
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: { volume: { include: { novel: true } } }
        });

        if (!chapter) return;

        await db.chapter.delete({
            where: { id: chapterId }
        });

        revalidatePath(`/dashboard/novels/edit/${chapter.volume.novelId}`);
        revalidatePath(`/truyen/${chapter.volume.novel.slug}`);
    } catch (error) {
        console.error("Delete chapter error:", error);
        throw error;
    }
}

const volumeSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    order: z.coerce.number().min(1, "Vui lòng nhập số thứ tự"),
    novelId: z.coerce.number().min(1, "Novel ID is required"),
});

export async function createVolume(data: z.infer<typeof volumeSchema>) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        return { error: "Unauthorized" };
    }

    const validatedFields = volumeSchema.safeParse(data);
    if (!validatedFields.success) return { error: "Invalid data" };

    const { title, order, novelId } = validatedFields.data;

    try {
        const novel = await db.novel.findUnique({ where: { id: novelId } });
        if (!novel) return { error: "Novel not found" };

        await db.volume.create({
            data: { title, order, novelId },
        });

        revalidatePath(`/dashboard/novels/edit/${novelId}`);
        revalidatePath(`/truyen/${novel.slug}`);
        return { success: "Tạo tập thành công!" };
    } catch (error) {
        return { error: "Lỗi khi tạo tập" };
    }
}

export async function updateVolume(volumeId: number, data: { title: string; order: number }) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        return { error: "Unauthorized" };
    }

    try {
        const volume = await db.volume.findUnique({ where: { id: volumeId }, include: { novel: true } });
        if (!volume) return { error: "Volume not found" };

        await db.volume.update({
            where: { id: volumeId },
            data: { title: data.title, order: data.order },
        });

        revalidatePath(`/dashboard/novels/edit/${volume.novelId}`);
        revalidatePath(`/truyen/${volume.novel.slug}`);
        return { success: "Cập nhật tập thành công!" };
    } catch (error) {
        return { error: "Lỗi khi cập nhật tập" };
    }
}

export async function deleteVolume(volumeId: number) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        return { error: "Unauthorized" };
    }

    try {
        const volume = await db.volume.findUnique({ where: { id: volumeId }, include: { novel: true } });
        if (!volume) return { error: "Volume not found" };

        await db.volume.delete({ where: { id: volumeId } });

        revalidatePath(`/dashboard/novels/edit/${volume.novelId}`);
        revalidatePath(`/truyen/${volume.novel.slug}`);
        return { success: "Xóa tập thành công!" };
    } catch (error) {
        return { error: "Lỗi khi xóa tập" };
    }
}

export async function reslugNovel(novelId: number) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        return { error: "Unauthorized" };
    }

    try {
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            include: {
                volumes: {
                    orderBy: { order: "asc" },
                    include: {
                        chapters: {
                            orderBy: { order: "asc" }
                        }
                    }
                }
            }
        });

        if (!novel) return { error: "Novel not found" };

        for (const volume of novel.volumes) {
            for (const chapter of volume.chapters) {
                const newSlug = `vol-${volume.order}-chap-${chapter.order}`;
                if (chapter.slug !== newSlug) {
                    await db.chapter.update({
                        where: { id: chapter.id },
                        data: { slug: newSlug }
                    });
                }
            }
        }

        revalidatePath(`/truyen/${novel.slug}`);
        return { success: "Cập nhật slug thành công!" };
    } catch (error) {
        console.error("Reslug error:", error);
        return { error: "Lỗi khi cập nhật slug" };
    }
}
