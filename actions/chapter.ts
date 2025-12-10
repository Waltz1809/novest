"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotification } from "@/actions/notification";
import { JSDOM } from "jsdom";

function stripHtml(html: string) {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent || "";
}

function countWords(text: string) {
    return text.trim().split(/\s+/).length;
}

const chapterSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống"),
    content: z.string().min(1, "Nội dung không được để trống"),
    volumeId: z.coerce.number().min(1, "Vui lòng chọn tập"),
    order: z.coerce.number().positive("Vui lòng nhập số thứ tự hợp lệ"),
    price: z.coerce.number().min(0).default(0),
    isLocked: z.boolean().default(false),
    isDraft: z.boolean().default(true), // Chapters are drafts by default
    publishAt: z.date().nullable().optional(), // Scheduled publish time
});

export async function getNovels() {
    const session = await auth();
    if (!session?.user) return [];

    const where = session.user.role === "ADMIN" ? {} : { uploaderId: session.user.id };

    try {
        const novels = await db.novel.findMany({
            where,
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

    const { title, content, volumeId, order, price, isLocked, isDraft, publishAt } = validatedFields.data;

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
        // For float orders (e.g., 1.5), replace dot with dash → chap-1-5
        // For integer orders (e.g., 15), keep as is → chap-15
        const chapterSlug = order.toString().replace('.', '-');
        const slug = `vol-${volume.order}-chap-${chapterSlug}`;

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

        // Calculate word count
        const plainText = stripHtml(content);
        const wordCount = countWords(plainText);

        await db.chapter.create({
            data: {
                title,
                content,
                volumeId,
                order,
                price,
                isLocked,
                slug,
                wordCount,
                isDraft: isDraft ?? true, // Default to draft
                publishAt: publishAt ?? null,
            },
        });

        revalidatePath(`/studio/novels/edit/${volume.novelId}`);
        revalidatePath(`/truyen/${volume.novel.slug}`);

        // Only notify users when chapter is published (not a draft)
        if (!isDraft) {
            const libraryEntries = await db.library.findMany({
                where: { novelId: volume.novelId },
                select: { userId: true }
            });

            if (libraryEntries.length > 0) {
                const notificationPromises = libraryEntries.map(entry =>
                    createNotification({
                        userId: entry.userId,
                        type: "NEW_CHAPTER",
                        resourceId: `/truyen/${volume.novel.slug}/${slug}`,
                        resourceType: "chapter",
                        message: `Truyện bạn thích vừa cập nhật chương ${volume.novel.title} - ${title} mới toanh luôn nè`,
                        actorId: session.user.id,
                    })
                );

                Promise.all(notificationPromises).catch(err =>
                    console.error("Failed to send notifications:", err)
                );
            }
        }

        return { success: isDraft ? "Đã lưu nháp chương!" : "Đã xuất bản chương thành công!" };
    } catch (error) {
        console.error("Create chapter error:", error);
        return { error: "Có lỗi xảy ra khi tạo chương" };
    }
}

export async function updateChapter(chapterId: number, data: z.infer<typeof chapterSchema>) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
        // Check if user is uploader
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: { volume: { include: { novel: { select: { uploaderId: true } } } } }
        });

        if (!chapter || chapter.volume.novel.uploaderId !== session?.user?.id) {
            return { error: "Unauthorized" };
        }
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

        // === VERSIONING: Save current version before updating ===
        // Only save version if content actually changed
        if (existingChapter.content !== content) {
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

            await db.chapterVersion.create({
                data: {
                    chapterId: existingChapter.id,
                    title: existingChapter.title,
                    content: existingChapter.content,
                    wordCount: existingChapter.wordCount,
                    expiresAt: oneWeekFromNow,
                },
            });
        }
        // === END VERSIONING ===

        // Only regenerate slug if volume or order changed
        let slug = existingChapter.slug;
        if (existingChapter.volumeId !== volumeId || existingChapter.order !== order) {
            const volume = await db.volume.findUnique({ where: { id: volumeId } });
            if (!volume) return { error: "Volume not found" };
            const chapterSlug = order.toString().replace('.', '-');
            slug = `vol-${volume.order}-chap-${chapterSlug}`;
        }

        // Calculate word count
        const plainText = stripHtml(content);
        const wordCount = countWords(plainText);

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
                wordCount,
            },
        });

        revalidatePath(`/studio/novels/edit/${existingChapter.volume.novelId}`);
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

        revalidatePath(`/studio/novels/edit/${chapter.volume.novelId}`);
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

        revalidatePath(`/studio/novels/edit/${novelId}`);
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

        revalidatePath(`/studio/novels/edit/${volume.novelId}`);
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

        await db.$transaction([
            db.chapter.deleteMany({ where: { volumeId } }),
            db.volume.delete({ where: { id: volumeId } })
        ]);

        revalidatePath(`/studio/novels/edit/${volume.novelId}`);
        revalidatePath(`/truyen/${volume.novel.slug}`);
        return { success: "Xóa tập thành công!" };
    } catch (error) {
        console.error("Delete volume error:", error);
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
                const chapterSlug = chapter.order.toString().replace('.', '-');
                const newSlug = `vol-${volume.order}-chap-${chapterSlug}`;
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

/**
 * Publish a draft chapter immediately
 */
export async function publishChapter(chapterId: number) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
        // Check if user is the uploader
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: { volume: { include: { novel: true } } }
        });

        if (!chapter || chapter.volume.novel.uploaderId !== session?.user?.id) {
            return { error: "Không có quyền thực hiện" };
        }
    }

    try {
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: { volume: { include: { novel: true } } }
        });

        if (!chapter) {
            return { error: "Không tìm thấy chương" };
        }

        if (!chapter.isDraft) {
            return { error: "Chương đã được xuất bản" };
        }

        // Publish the chapter
        await db.chapter.update({
            where: { id: chapterId },
            data: {
                isDraft: false,
                publishAt: null, // Clear scheduled time
            },
        });

        // Notify users who have this novel in their library
        const libraryEntries = await db.library.findMany({
            where: { novelId: chapter.volume.novelId },
            select: { userId: true }
        });

        if (libraryEntries.length > 0) {
            const notificationPromises = libraryEntries.map(entry =>
                createNotification({
                    userId: entry.userId,
                    type: "NEW_CHAPTER",
                    resourceId: `/truyen/${chapter.volume.novel.slug}/${chapter.slug}`,
                    resourceType: "chapter",
                    message: `Truyện bạn thích vừa cập nhật chương ${chapter.volume.novel.title} - ${chapter.title} mới toanh luôn nè`,
                    actorId: session.user.id,
                })
            );

            Promise.all(notificationPromises).catch(err =>
                console.error("Failed to send notifications:", err)
            );
        }

        revalidatePath(`/studio/novels/edit/${chapter.volume.novelId}`);
        revalidatePath(`/truyen/${chapter.volume.novel.slug}`);
        revalidatePath(`/truyen/${chapter.volume.novel.slug}/${chapter.slug}`);

        return { success: "Đã xuất bản chương thành công!" };
    } catch (error) {
        console.error("Publish chapter error:", error);
        return { error: "Lỗi khi xuất bản chương" };
    }
}

/**
 * Schedule a chapter to be published at a specific time
 */
export async function schedulePublish(chapterId: number, publishAt: Date) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Không có quyền thực hiện" };
    }

    try {
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: { volume: { include: { novel: true } } }
        });

        if (!chapter) {
            return { error: "Không tìm thấy chương" };
        }

        // Check permission
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = chapter.volume.novel.uploaderId === session.user.id;
        const isGroupMember = chapter.volume.novel.translationGroupId
            ? await db.translationGroupMember.findFirst({
                where: { groupId: chapter.volume.novel.translationGroupId, userId: session.user.id }
            })
            : null;

        if (!isAdmin && !isUploader && !isGroupMember) {
            return { error: "Không có quyền thực hiện" };
        }

        if (!chapter.isDraft) {
            return { error: "Chương đã được xuất bản, không thể đặt lịch" };
        }

        // Validate publish time is in the future
        if (publishAt <= new Date()) {
            return { error: "Thời gian xuất bản phải trong tương lai" };
        }

        await db.chapter.update({
            where: { id: chapterId },
            data: {
                publishAt,
            },
        });

        revalidatePath(`/studio/novels/edit/${chapter.volume.novelId}`);

        const formattedDate = publishAt.toLocaleString('vi-VN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        return { success: `Đã đặt lịch xuất bản vào ${formattedDate}` };
    } catch (error) {
        console.error("Schedule publish error:", error);
        return { error: "Lỗi khi đặt lịch xuất bản" };
    }
}

/**
 * Cancel scheduled publish
 */
export async function cancelScheduledPublish(chapterId: number) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Không có quyền thực hiện" };
    }

    try {
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: { volume: { include: { novel: true } } }
        });

        if (!chapter) {
            return { error: "Không tìm thấy chương" };
        }

        // Check permission
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = chapter.volume.novel.uploaderId === session.user.id;
        const isGroupMember = chapter.volume.novel.translationGroupId
            ? await db.translationGroupMember.findFirst({
                where: { groupId: chapter.volume.novel.translationGroupId, userId: session.user.id }
            })
            : null;

        if (!isAdmin && !isUploader && !isGroupMember) {
            return { error: "Không có quyền thực hiện" };
        }

        await db.chapter.update({
            where: { id: chapterId },
            data: {
                publishAt: null,
            },
        });

        revalidatePath(`/studio/novels/edit/${chapter.volume.novelId}`);

        return { success: "Đã hủy lịch xuất bản" };
    } catch (error) {
        console.error("Cancel scheduled publish error:", error);
        return { error: "Lỗi khi hủy lịch xuất bản" };
    }
}

// Get version history for a chapter
export async function getChapterVersions(chapterId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Chưa đăng nhập" };
        }

        // Get chapter with novel uploader info
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: {
                volume: {
                    include: {
                        novel: {
                            select: { uploaderId: true, translationGroupId: true },
                        },
                    },
                },
            },
        });

        if (!chapter) {
            return { error: "Không tìm thấy chương" };
        }

        // Check permission
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = chapter.volume.novel.uploaderId === session.user.id;
        const isGroupMember = chapter.volume.novel.translationGroupId
            ? await db.translationGroupMember.findFirst({
                where: { groupId: chapter.volume.novel.translationGroupId, userId: session.user.id }
            })
            : null;

        if (!isAdmin && !isUploader && !isGroupMember) {
            return { error: "Không có quyền thực hiện" };
        }

        // Fetch versions ordered by creation date (newest first)
        const versions = await db.chapterVersion.findMany({
            where: {
                chapterId: chapterId,
                expiresAt: { gt: new Date() }, // Only non-expired versions
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                wordCount: true,
                createdAt: true,
                expiresAt: true,
            },
        });

        return { versions };
    } catch (error) {
        console.error("Get chapter versions error:", error);
        return { error: "Lỗi khi tải lịch sử phiên bản" };
    }
}

// Revert chapter to a previous version
export async function revertChapter(chapterId: number, versionId: number) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Chưa đăng nhập" };
        }

        // Get chapter with novel uploader info
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: {
                volume: {
                    include: {
                        novel: {
                            select: { uploaderId: true, translationGroupId: true },
                        },
                    },
                },
            },
        });

        if (!chapter) {
            return { error: "Không tìm thấy chương" };
        }

        // Check permission
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = chapter.volume.novel.uploaderId === session.user.id;
        const isGroupMember = chapter.volume.novel.translationGroupId
            ? await db.translationGroupMember.findFirst({
                where: { groupId: chapter.volume.novel.translationGroupId, userId: session.user.id }
            })
            : null;

        if (!isAdmin && !isUploader && !isGroupMember) {
            return { error: "Không có quyền thực hiện" };
        }

        // Get the version to revert to
        const version = await db.chapterVersion.findUnique({
            where: { id: versionId },
        });

        if (!version || version.chapterId !== chapterId) {
            return { error: "Không tìm thấy phiên bản" };
        }

        if (version.expiresAt && version.expiresAt < new Date()) {
            return { error: "Phiên bản này đã hết hạn" };
        }

        // Save current version before reverting (so user can undo if needed)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.chapterVersion.create({
            data: {
                chapterId: chapter.id,
                title: chapter.title,
                content: chapter.content,
                wordCount: chapter.wordCount,
                expiresAt: expiresAt,
            },
        });

        // Revert chapter to the selected version
        await db.chapter.update({
            where: { id: chapterId },
            data: {
                title: version.title,
                content: version.content,
                wordCount: version.wordCount,
            },
        });

        revalidatePath(`/studio/novels/edit/${chapter.volume.novelId}`);
        revalidatePath(`/truyen/${chapter.volume.novelId}/${chapter.slug}`);

        return { success: "Đã khôi phục phiên bản thành công" };
    } catch (error) {
        console.error("Revert chapter error:", error);
        return { error: "Lỗi khi khôi phục phiên bản" };
    }
}

// Cleanup expired versions (to be called by a cron job)
export async function cleanupExpiredVersions() {
    try {
        const result = await db.chapterVersion.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });

        console.log(`Cleaned up ${result.count} expired chapter versions`);
        return { success: `Deleted ${result.count} expired versions` };
    } catch (error) {
        console.error("Cleanup expired versions error:", error);
        return { error: "Failed to cleanup expired versions" };
    }
}
