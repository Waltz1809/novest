"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
    calculateChapterPrice,
    canHavePremiumChapters,
    canChapterBePremium,
    getSuggestedPriceRange,
    MIN_WORDS_FOR_PREMIUM,
} from "@/lib/pricing";

/**
 * Get pricing info for a chapter
 */
export async function getChapterPricingInfo(chapterId: number) {
    try {
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            select: {
                id: true,
                title: true,
                wordCount: true,
                isLocked: true,
                price: true,
                volume: {
                    select: {
                        novelId: true,
                        novel: {
                            select: {
                                id: true,
                                title: true,
                                novelFormat: true,
                                discountPercent: true,
                                status: true,
                                uploaderId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!chapter) {
            return { error: "Không tìm thấy chương" };
        }

        // Calculate total novel word count
        const totalWordCount = await db.chapter.aggregate({
            where: {
                volume: { novelId: chapter.volume.novelId },
                isDraft: false,
            },
            _sum: { wordCount: true },
        });

        const novelTotalWords = totalWordCount._sum.wordCount || 0;
        const canBePremium = canHavePremiumChapters(novelTotalWords) && canChapterBePremium(chapter.wordCount);
        const suggestedRange = getSuggestedPriceRange(
            chapter.wordCount,
            chapter.volume.novel.novelFormat
        );

        // Apply discount if novel is completed
        let discountPercent = 0;
        if (chapter.volume.novel.status === "COMPLETED") {
            discountPercent = chapter.volume.novel.discountPercent;
        }

        return {
            chapter: {
                id: chapter.id,
                title: chapter.title,
                wordCount: chapter.wordCount,
                isLocked: chapter.isLocked,
                price: chapter.price,
            },
            novel: {
                id: chapter.volume.novel.id,
                title: chapter.volume.novel.title,
                novelFormat: chapter.volume.novel.novelFormat,
                discountPercent,
                status: chapter.volume.novel.status,
                totalWordCount: novelTotalWords,
                uploaderId: chapter.volume.novel.uploaderId,
            },
            pricing: {
                canBePremium,
                suggestedRange,
                minWordsForPremium: MIN_WORDS_FOR_PREMIUM,
            },
        };
    } catch (error) {
        console.error("Get chapter pricing info error:", error);
        return { error: "Lỗi khi tải thông tin giá" };
    }
}

/**
 * Set chapter as premium with specified price
 */
export async function setChapterPremium(chapterId: number, price: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: {
                volume: {
                    include: {
                        novel: {
                            select: {
                                uploaderId: true,
                                novelFormat: true,
                                status: true,
                                discountPercent: true,
                                isLicensedDrop: true,
                            },
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

        if (!isAdmin && !isUploader) {
            return { error: "Không có quyền thực hiện" };
        }

        // Block VIP for licensed drop novels
        if (chapter.volume.novel.isLicensedDrop) {
            return { error: "Không thể đặt chương trả phí cho truyện bản quyền đã drop" };
        }

        // Check if chapter can be premium
        if (!canChapterBePremium(chapter.wordCount)) {
            return { error: "Chương phải có ít nhất 1000 từ để đặt premium" };
        }

        // Calculate total novel word count
        const totalWordCount = await db.chapter.aggregate({
            where: {
                volume: { novelId: chapter.volume.novelId },
                isDraft: false,
            },
            _sum: { wordCount: true },
        });

        const novelTotalWords = totalWordCount._sum.wordCount || 0;
        if (!canHavePremiumChapters(novelTotalWords)) {
            return { error: `Truyện cần tối thiểu ${MIN_WORDS_FOR_PREMIUM.toLocaleString()} từ để có chương premium` };
        }

        // Validate price (must be between min and max suggested)
        const suggested = getSuggestedPriceRange(
            chapter.wordCount,
            chapter.volume.novel.novelFormat
        );

        if (price < suggested.min || price > suggested.max) {
            return { error: `Giá phải trong khoảng ${suggested.min} - ${suggested.max} vé` };
        }

        // Update chapter
        await db.chapter.update({
            where: { id: chapterId },
            data: {
                isLocked: true,
                price: price,
            },
        });

        revalidatePath(`/studio/novels/edit/${chapter.volume.novelId}`);
        revalidatePath(`/truyen/${chapter.volume.novelId}`);

        return { success: "Đã đặt chương premium" };
    } catch (error) {
        console.error("Set chapter premium error:", error);
        return { error: "Lỗi khi đặt chương premium" };
    }
}

/**
 * Remove premium from a chapter (make it free)
 */
export async function removeChapterPremium(chapterId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const chapter = await db.chapter.findUnique({
            where: { id: chapterId },
            include: {
                volume: {
                    include: {
                        novel: {
                            select: { uploaderId: true },
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

        if (!isAdmin && !isUploader) {
            return { error: "Không có quyền thực hiện" };
        }

        // Update chapter
        await db.chapter.update({
            where: { id: chapterId },
            data: {
                isLocked: false,
                price: 0,
            },
        });

        revalidatePath(`/studio/novels/edit/${chapter.volume.novelId}`);
        revalidatePath(`/truyen/${chapter.volume.novelId}`);

        return { success: "Đã bỏ premium chương" };
    } catch (error) {
        console.error("Remove chapter premium error:", error);
        return { error: "Lỗi khi bỏ premium chương" };
    }
}

/**
 * Auto-calculate and set prices for multiple chapters
 */
export async function autoCalculatePrices(novelId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: {
                id: true,
                uploaderId: true,
                novelFormat: true,
                status: true,
                discountPercent: true,
                volumes: {
                    include: {
                        chapters: {
                            where: { isDraft: false, isLocked: true },
                            select: {
                                id: true,
                                wordCount: true,
                            },
                        },
                    },
                },
            },
        });

        if (!novel) {
            return { error: "Không tìm thấy truyện" };
        }

        // Check permission
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = novel.uploaderId === session.user.id;

        if (!isAdmin && !isUploader) {
            return { error: "Không có quyền thực hiện" };
        }

        // Get discount if novel is completed
        const discountPercent = novel.status === "COMPLETED" ? novel.discountPercent : 0;

        // Calculate and update prices for all premium chapters
        const chapters = novel.volumes.flatMap((v) => v.chapters);
        let updatedCount = 0;

        for (const chapter of chapters) {
            const newPrice = calculateChapterPrice(
                chapter.wordCount,
                novel.novelFormat,
                discountPercent
            );

            await db.chapter.update({
                where: { id: chapter.id },
                data: { price: newPrice },
            });

            updatedCount++;
        }

        revalidatePath(`/studio/novels/edit/${novelId}`);
        revalidatePath(`/truyen/${novelId}`);

        return { success: `Đã cập nhật giá cho ${updatedCount} chương` };
    } catch (error) {
        console.error("Auto calculate prices error:", error);
        return { error: "Lỗi khi tính giá tự động" };
    }
}

/**
 * Update novel discount percentage (for completed novels)
 */
export async function updateNovelDiscount(novelId: number, discountPercent: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: {
                id: true,
                uploaderId: true,
                status: true,
            },
        });

        if (!novel) {
            return { error: "Không tìm thấy truyện" };
        }

        // Check permission
        const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
        const isUploader = novel.uploaderId === session.user.id;

        if (!isAdmin && !isUploader) {
            return { error: "Không có quyền thực hiện" };
        }

        // Only completed novels can have discounts
        if (novel.status !== "COMPLETED") {
            return { error: "Chỉ truyện đã hoàn thành mới có thể đặt giảm giá" };
        }

        // Validate discount range (10-100%)
        const validDiscount = Math.max(10, Math.min(100, Math.round(discountPercent)));

        await db.novel.update({
            where: { id: novelId },
            data: { discountPercent: validDiscount },
        });

        revalidatePath(`/studio/novels/edit/${novelId}`);
        revalidatePath(`/truyen/${novelId}`);

        return { success: `Đã đặt giảm giá ${validDiscount}%` };
    } catch (error) {
        console.error("Update novel discount error:", error);
        return { error: "Lỗi khi cập nhật giảm giá" };
    }
}
