"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleLibrary(novelId: number) {
    const session = await auth();
    if (!session?.user || !session.user.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // 1. Check if User exists in DB (integrity check)
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true }
    });

    if (!user) {
        console.error(`[toggleLibrary] User not found in DB: ${userId}`);
        throw new Error("User account not found");
    }

    // 2. Check if Novel exists
    const novel = await db.novel.findUnique({
        where: { id: novelId },
        select: { id: true }
    });

    if (!novel) {
        console.error(`[toggleLibrary] Novel not found: ${novelId}`);
        throw new Error("Novel not found");
    }

    const existing = await db.library.findUnique({
        where: {
            userId_novelId: {
                userId,
                novelId,
            },
        },
    });

    try {
        if (existing) {
            await db.library.delete({
                where: {
                    userId_novelId: {
                        userId,
                        novelId,
                    },
                },
            });
        } else {
            await db.library.create({
                data: {
                    userId,
                    novelId,
                },
            });
        }
    } catch (error: any) {
        console.error("[toggleLibrary] Database error:", error);
        // Handle Prisma foreign key constraint errors
        if (error.code === 'P2003') {
            throw new Error("Foreign key constraint failed. The novel or user may not exist.");
        }
        throw error;
    }

    revalidatePath(`/truyen/[slug]`); // Note: We can't easily get the slug here without fetching, but client optimistically updates anyway.
    revalidatePath("/tu-truyen");
    return !existing;
}

export async function updateReadingHistory(novelId: number, chapterId: number) {
    const session = await auth();
    if (!session?.user) return;

    const userId = session.user.id;

    try {
        // Validate that both novel and chapter exist before upserting
        const [novel, chapter] = await Promise.all([
            db.novel.findUnique({ where: { id: novelId }, select: { id: true } }),
            db.chapter.findUnique({ where: { id: chapterId }, select: { id: true } }),
        ]);

        if (!novel || !chapter) {
            console.warn(`[updateReadingHistory] Invalid novelId=${novelId} or chapterId=${chapterId}`);
            return;
        }

        await db.readingHistory.upsert({
            where: {
                userId_novelId: {
                    userId,
                    novelId,
                },
            },
            update: {
                chapterId,
            },
            create: {
                userId,
                novelId,
                chapterId,
            },
        });

        revalidatePath("/tu-truyen");
    } catch (error) {
        console.error("[updateReadingHistory] Error:", error);
        // Silently fail - reading history is not critical
    }
}

export async function getLibrary() {
    const session = await auth();
    if (!session?.user) return [];

    const library = await db.library.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            novel: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return library;
}

export async function getHistory() {
    const session = await auth();
    if (!session?.user) return [];

    const history = await db.readingHistory.findMany({
        where: {
            userId: session.user.id,
        },
        include: {
            novel: true,
            chapter: true,
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    return history;
}
