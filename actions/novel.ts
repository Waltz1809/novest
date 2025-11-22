"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createNovel(data: {
    title: string;
    slug: string;
    author: string;
    description: string;
    status: string;
    coverImage: string;
}) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        throw new Error("Unauthorized");
    }

    await db.novel.create({
        data: {
            ...data,
        },
    });

    revalidatePath("/dashboard/novels");
    revalidatePath("/");
}

export async function updateNovel(id: number, data: {
    title: string;
    slug: string;
    author: string;
    description: string;
    status: string;
    coverImage: string;
}) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        throw new Error("Unauthorized");
    }

    await db.novel.update({
        where: { id },
        data: {
            ...data,
        },
    });

    revalidatePath("/dashboard/novels");
    revalidatePath(`/truyen/${data.slug}`);
    revalidatePath("/");
}

export async function getNovel(id: number) {
    const novel = await db.novel.findUnique({
        where: { id },
    });
    return novel;
}
