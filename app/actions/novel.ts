"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function updateNovel(
    novelId: number,
    data: {
        title: string;
        author: string;
        description: string;
        status: string;
    }
) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Check if user is admin or owns the novel
    const novel = await db.novel.findUnique({
        where: { id: novelId },
        select: { uploaderId: true },
    });

    if (!novel) {
        throw new Error("Novel not found");
    }

    if (session.user.role !== "ADMIN" && novel.uploaderId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    // Generate new slug based on new title and existing ID
    const newSlug = `${toSlug(data.title)}-${novelId}`;

    // Update the novel with new data and regenerated slug
    await db.novel.update({
        where: { id: novelId },
        data: {
            title: data.title,
            slug: newSlug, // Always regenerate slug when title changes
            author: data.author,
            description: data.description,
            status: data.status,
        },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/novels/edit/${novelId}`);
    revalidatePath("/dashboard/novels");
    revalidatePath("/dashboard");

    return { success: true };
}

export async function updateNovelCoverUrl(novelId: number, coverUrl: string) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Check if user is admin or owns the novel
    const novel = await db.novel.findUnique({
        where: { id: novelId },
        select: { uploaderId: true },
    });

    if (!novel) {
        throw new Error("Novel not found");
    }

    if (session.user.role !== "ADMIN" && novel.uploaderId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    // Update database
    await db.novel.update({
        where: { id: novelId },
        data: { coverImage: coverUrl },
    });

    // Revalidate paths
    revalidatePath(`/dashboard/novels/edit/${novelId}`);
    revalidatePath("/dashboard/novels");
    revalidatePath("/dashboard");

    return { success: true };
}
