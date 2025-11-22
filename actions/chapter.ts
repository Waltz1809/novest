"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getNovels() {
    const novels = await db.novel.findMany({
        select: {
            id: true,
            title: true,
            slug: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return novels;
}

export async function getVolumes(novelId: number) {
    const volumes = await db.volume.findMany({
        where: { novelId },
        select: {
            id: true,
            title: true,
        },
        orderBy: {
            order: "asc",
        },
    });
    return volumes;
}

export async function createChapter(data: {
    title: string;
    content: string;
    novelId: number;
    volumeId: number;
    price: number;
    isLocked: boolean;
    slug: string;
    order: number;
}) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        throw new Error("Unauthorized");
    }

    const { title, content, novelId, volumeId, price, isLocked, slug, order } = data;

    // Create Chapter
    await db.chapter.create({
        data: {
            title,
            content,
            order,
            slug,
            price: isLocked ? price : 0,
            isLocked,
            volumeId,
        },
    });

    // Revalidate
    const novel = await db.novel.findUnique({ where: { id: novelId } });
    if (novel) {
        revalidatePath(`/truyen/${novel.slug}`);
        revalidatePath(`/dashboard/novels`);
    }

    return { success: true };
}
