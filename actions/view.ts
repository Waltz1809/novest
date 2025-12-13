"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";

const VIEWED_NOVELS_COOKIE = "viewed_novels_today";
const VIEWED_CHAPTERS_COOKIE = "viewed_chapters_today";

/**
 * Increment view count for a novel (legacy - called from novel detail page)
 * Uses cookie-based tracking to prevent spam (1 view per novel per user per day)
 * 
 * NOTE: This function can only READ cookies when called from Server Component.
 * It will skip setting cookies if called during SSR to avoid the Next.js error.
 */
export async function incrementView(novelId: number): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const viewedNovelsStr = cookieStore.get(VIEWED_NOVELS_COOKIE)?.value || "";
        const viewedNovels = viewedNovelsStr ? viewedNovelsStr.split(",").map(Number) : [];

        // Check if user already viewed this novel today
        if (viewedNovels.includes(novelId)) {
            return false; // Already counted today
        }

        // Increment view count in database
        await db.novel.update({
            where: { id: novelId },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        });

        // Note: We can't set cookies from Server Component render
        // The cookie will be set via a separate client-side call if needed
        // For now, we just increment the view without cookie protection during SSR

        return true; // View counted
    } catch (error) {
        console.error("[incrementView] Error:", error);
        return false;
    }
}

/**
 * Mark novel as viewed in cookie (call from client-side only)
 */
export async function markNovelViewed(novelId: number): Promise<void> {
    try {
        const cookieStore = await cookies();
        const viewedNovelsStr = cookieStore.get(VIEWED_NOVELS_COOKIE)?.value || "";
        const viewedNovels = viewedNovelsStr ? viewedNovelsStr.split(",").map(Number) : [];

        if (!viewedNovels.includes(novelId)) {
            viewedNovels.push(novelId);

            // Set cookie with expiration at midnight
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);

            cookieStore.set(VIEWED_NOVELS_COOKIE, viewedNovels.join(","), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: secondsUntilMidnight,
                path: "/",
            });
        }
    } catch (error) {
        console.error("[markNovelViewed] Error:", error);
    }
}

/**
 * Increment view count based on chapter reading completion
 * Called when user scrolls >= 85% of chapter content (from GA4 tracker)
 * Uses per-chapter cookie tracking to prevent spam
 * 
 * @param novelId - The novel ID to increment view for
 * @param chapterId - The chapter ID (for tracking which chapters have been counted)
 * @returns true if view was counted, false if already counted or error
 */
export async function incrementChapterView(novelId: number, chapterId: number): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const viewedChaptersStr = cookieStore.get(VIEWED_CHAPTERS_COOKIE)?.value || "";
        const viewedChapters = viewedChaptersStr ? viewedChaptersStr.split(",").map(Number) : [];

        // Check if this chapter was already counted today
        if (viewedChapters.includes(chapterId)) {
            return false; // Already counted today
        }

        // Increment view count in database
        await db.novel.update({
            where: { id: novelId },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        });

        // Update cookie with this chapter
        viewedChapters.push(chapterId);

        // Set cookie with expiration at midnight
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);

        cookieStore.set(VIEWED_CHAPTERS_COOKIE, viewedChapters.join(","), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: secondsUntilMidnight,
            path: "/",
        });

        return true; // View counted
    } catch (error) {
        console.error("[incrementChapterView] Error:", error);
        return false;
    }
}

