"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const VIEWED_NOVELS_COOKIE = "viewed_novels_today";

/**
 * Increment view count for a novel
 * Uses cookie-based tracking to prevent spam (1 view per novel per user per day)
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

        // Add novel to viewed list
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

        return true; // View counted
    } catch (error) {
        console.error("[incrementView] Error:", error);
        return false;
    }
}
