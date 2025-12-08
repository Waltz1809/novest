"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notification";

/**
 * Publish all scheduled chapters that have passed their publishAt time
 * This should be called by a cron job or on-demand
 */
export async function publishScheduledChapters() {
    try {
        // Find all draft chapters with publishAt in the past
        const scheduledChapters = await db.chapter.findMany({
            where: {
                isDraft: true,
                publishAt: {
                    lte: new Date(), // publishAt <= now
                    not: null,
                },
            },
            include: {
                volume: {
                    include: {
                        novel: true,
                    },
                },
            },
        });

        if (scheduledChapters.length === 0) {
            return { success: true, published: 0, message: "No chapters to publish" };
        }

        // Publish each chapter
        const publishedIds: number[] = [];

        for (const chapter of scheduledChapters) {
            // Update chapter to published
            await db.chapter.update({
                where: { id: chapter.id },
                data: {
                    isDraft: false,
                    publishAt: null, // Clear the schedule
                },
            });

            publishedIds.push(chapter.id);

            // Send notifications to library users
            const libraryUsers = await db.library.findMany({
                where: { novelId: chapter.volume.novelId },
                select: { userId: true },
            });

            for (const libraryUser of libraryUsers) {
                await createNotification({
                    userId: libraryUser.userId,
                    type: "NEW_CHAPTER",
                    resourceId: `/truyen/${chapter.volume.novel.slug}/${chapter.slug}`,
                    resourceType: "chapter",
                    message: `Truyện bạn thích vừa cập nhật chương [${chapter.volume.novel.title} - ${chapter.title}] mới toanh luôn nè`,
                });
            }

            // Revalidate paths
            revalidatePath(`/truyen/${chapter.volume.novel.slug}`);
            revalidatePath(`/truyen/${chapter.volume.novel.slug}/${chapter.slug}`);
        }

        console.log(`[Cron] Published ${publishedIds.length} scheduled chapters: ${publishedIds.join(", ")}`);

        return {
            success: true,
            published: publishedIds.length,
            chapterIds: publishedIds,
        };
    } catch (error) {
        console.error("[Cron] Error publishing scheduled chapters:", error);
        return { success: false, error: "Failed to publish scheduled chapters" };
    }
}
