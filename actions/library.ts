"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleLibrary(novelId: number) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    const existing = await db.library.findUnique({
        where: {
            userId_novelId: {
                userId,
                novelId,
            },
        },
    });

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

    revalidatePath(`/truyen/[slug]`); // Note: We can't easily get the slug here without fetching, but client optimistically updates anyway.
    revalidatePath("/tu-truyen");
    return !existing;
}

export async function updateReadingHistory(novelId: number, chapterId: number) {
    const session = await auth();
    if (!session?.user) return;

    const userId = session.user.id;

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
