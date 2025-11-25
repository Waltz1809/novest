"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateSearchIndex } from "@/lib/utils";

export async function createNovel(data: {
    title: string;
    slug: string;
    author: string;
    description: string;
    status: string;
    coverImage: string;
    alternativeTitles?: string;
    genreIds?: number[];
}) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        throw new Error("Unauthorized");
    }

    const searchIndex = generateSearchIndex(data.title, data.author, data.alternativeTitles || "");

    await db.novel.create({
        data: {
            title: data.title,
            slug: data.slug,
            author: data.author,
            description: data.description,
            status: data.status,
            coverImage: data.coverImage,
            alternativeTitles: data.alternativeTitles,
            searchIndex,
            uploaderId: session.user.id,
            genres: {
                connect: data.genreIds?.map((id) => ({ id: Number(id) })),
            },
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
    alternativeTitles?: string;
    genreIds?: number[];
}) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        throw new Error("Unauthorized");
    }

    const searchIndex = generateSearchIndex(data.title, data.author, data.alternativeTitles || "");

    await db.novel.update({
        where: { id: Number(id) },
        data: {
            title: data.title,
            slug: data.slug,
            author: data.author,
            description: data.description,
            status: data.status,
            coverImage: data.coverImage,
            alternativeTitles: data.alternativeTitles,
            searchIndex,
            genres: {
                set: [], // Clear old genres
                connect: data.genreIds?.map((id) => ({ id: Number(id) })),
            },
        },
    });

    revalidatePath("/dashboard/novels");
    revalidatePath(`/truyen/${data.slug}`);
    revalidatePath("/");
}

export async function getNovel(id: number) {
    const novel = await db.novel.findUnique({
        where: { id },
        include: {
            genres: true,
        },
    });
    return novel;
}

export async function deleteNovel(id: number) {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        throw new Error("Unauthorized");
    }

    await db.novel.delete({
        where: { id },
    });

    revalidatePath("/dashboard/novels");
    revalidatePath("/");
}

export async function reindexAllNovels() {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "TRANSLATOR")) {
        throw new Error("Unauthorized");
    }

    const novels = await db.novel.findMany();

    for (const novel of novels) {
        const searchIndex = generateSearchIndex(novel.title, novel.author, novel.alternativeTitles || "");
        await db.novel.update({
            where: { id: novel.id },
            data: { searchIndex },
        });
    }

    revalidatePath("/dashboard/novels");
}
