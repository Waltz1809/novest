"use server";

import { db } from "@/lib/db";

export interface NovelWithViewCount {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
    viewCount: number;
}

export interface NovelWithRating {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
    averageRating: number;
    ratingCount: number;
}

/**
 * Get top viewed novels ordered by viewCount descending
 * @param limit Number of novels to return (default: 10)
 */
export async function getTopViewed(limit: number = 10): Promise<NovelWithViewCount[]> {
    const novels = await db.novel.findMany({
        where: {
            approvalStatus: "APPROVED", // Only show approved novels
            isR18: false, // Hide R18 from public listings
        },
        select: {
            id: true,
            title: true,
            slug: true,
            author: true,
            coverImage: true,
            viewCount: true,
        },
        orderBy: {
            viewCount: "desc",
        },
        take: limit,
    });

    return novels;
}

/**
 * Get top rated novels ordered by average rating descending
 * @param limit Number of novels to return (default: 10)
 */
export async function getTopRated(limit: number = 10): Promise<NovelWithRating[]> {
    // Get all approved novels with their ratings
    const novelsWithRatings = await db.novel.findMany({
        where: {
            approvalStatus: "APPROVED", // Only show approved novels
            isR18: false, // Hide R18 from public listings
        },
        select: {
            id: true,
            title: true,
            slug: true,
            author: true,
            coverImage: true,
            ratings: {
                select: {
                    score: true,
                },
            },
        },
    });

    // Calculate average rating for each novel
    const novelsWithAverage = novelsWithRatings
        .map((novel) => {
            const totalScore = novel.ratings.reduce((sum, rating) => sum + rating.score, 0);
            const ratingCount = novel.ratings.length;
            const averageRating = ratingCount > 0 ? totalScore / ratingCount : 0;

            return {
                id: novel.id,
                title: novel.title,
                slug: novel.slug,
                author: novel.author,
                coverImage: novel.coverImage,
                averageRating: Number(averageRating.toFixed(2)),
                ratingCount,
            };
        })
        // Only include novels with at least one rating
        .filter((novel) => novel.ratingCount > 0)
        // Sort by average rating descending, then by rating count as tiebreaker
        .sort((a, b) => {
            if (b.averageRating !== a.averageRating) {
                return b.averageRating - a.averageRating;
            }
            return b.ratingCount - a.ratingCount;
        })
        .slice(0, limit);

    return novelsWithAverage;
}

/**
 * Increment view count for a novel (fire and forget)
 * This is called when a user views a chapter
 * @param novelId ID of the novel to increment views for
 */
export async function incrementView(novelId: number): Promise<void> {
    try {
        await db.novel.update({
            where: { id: novelId },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        });
    } catch (error) {
        // Silently fail - we don't want to block page rendering
        console.error(`Failed to increment view for novel ${novelId}:`, error);
    }
}
