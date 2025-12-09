"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Save user recommendation preferences
export async function saveUserPreferences(nations: string[], genreIds: number[]) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Bạn cần đăng nhập." }
    }

    try {
        await db.userPreference.upsert({
            where: { userId: session.user.id },
            update: {
                nations: nations.join(","),
                genreIds: genreIds.join(","),
                skipped: false,
            },
            create: {
                userId: session.user.id,
                nations: nations.join(","),
                genreIds: genreIds.join(","),
                skipped: false,
            },
        })

        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Error saving preferences:", error)
        return { error: "Có lỗi xảy ra khi lưu tùy chọn." }
    }
}

// Skip recommendation onboarding
export async function skipRecommendation() {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "Bạn cần đăng nhập." }
    }

    try {
        await db.userPreference.upsert({
            where: { userId: session.user.id },
            update: { skipped: true },
            create: {
                userId: session.user.id,
                skipped: true,
            },
        })

        return { success: true }
    } catch (error) {
        console.error("Error skipping preferences:", error)
        return { error: "Có lỗi xảy ra." }
    }
}

// Get user preferences
export async function getUserPreferences() {
    const session = await auth()
    if (!session?.user?.id) {
        return null
    }

    try {
        const preference = await db.userPreference.findUnique({
            where: { userId: session.user.id },
        })

        if (!preference) return null

        return {
            nations: preference.nations ? preference.nations.split(",").filter(Boolean) : [],
            genreIds: preference.genreIds ? preference.genreIds.split(",").filter(Boolean).map(Number) : [],
            skipped: preference.skipped,
        }
    } catch (error) {
        console.error("Error getting preferences:", error)
        return null
    }
}

// Get recommended novels based on user preferences
export async function getRecommendedNovels(limit: number = 10) {
    const session = await auth()
    if (!session?.user?.id) {
        return { novels: [] }
    }

    try {
        const preference = await db.userPreference.findUnique({
            where: { userId: session.user.id },
        })

        // If no preferences or skipped, return empty
        if (!preference || preference.skipped || (!preference.nations && !preference.genreIds)) {
            return { novels: [] }
        }

        const nations = preference.nations ? preference.nations.split(",").filter(Boolean) : []
        const genreIds = preference.genreIds ? preference.genreIds.split(",").filter(Boolean).map(Number) : []

        // Build where condition - match any nation OR any genre
        const whereConditions: any[] = []

        if (nations.length > 0) {
            whereConditions.push({ nation: { in: nations } })
        }

        if (genreIds.length > 0) {
            whereConditions.push({
                genres: {
                    some: { id: { in: genreIds } }
                }
            })
        }

        if (whereConditions.length === 0) {
            return { novels: [] }
        }

        const novels = await db.novel.findMany({
            where: {
                OR: whereConditions,
            },
            select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                nation: true,
                genres: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                volumes: {
                    select: {
                        _count: {
                            select: { chapters: true }
                        }
                    }
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: limit,
        })

        return { novels }
    } catch (error) {
        console.error("Error getting recommended novels:", error)
        return { novels: [] }
    }
}

// Get all genres for selection
export async function getAllGenres() {
    try {
        const genres = await db.genre.findMany({
            orderBy: { name: 'asc' },
        })
        return { genres }
    } catch (error) {
        console.error("Error getting genres:", error)
        return { genres: [] }
    }
}
