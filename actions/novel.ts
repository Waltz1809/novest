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

    // Get current novel data to check for old cover image
    const currentNovel = await db.novel.findUnique({
        where: { id: Number(id) },
        select: { coverImage: true }
    });

    // Delete old cover image from R2 if it exists and is different
    if (currentNovel?.coverImage && currentNovel.coverImage !== data.coverImage) {
        const { deleteFromR2 } = await import("./upload");
        await deleteFromR2(currentNovel.coverImage);
    }

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

export async function getRelatedNovels(novelId: number, genreIds: number[], limit: number = 5) {
    // 1. Get the current novel to check author (if not passed, we might need to fetch it, but let's assume we can get it from the candidates or just ignore author boost if we don't have it handy. 
    // Actually, we need the author of the current novel to boost same author. 
    // Let's fetch the current novel's author first.
    const currentNovel = await db.novel.findUnique({
        where: { id: novelId },
        select: { author: true }
    });

    if (!currentNovel) return [];

    // 2. Find candidates: Novels that share AT LEAST ONE genre
    // We fetch a bit more than the limit to sort them in memory
    const candidates = await db.novel.findMany({
        where: {
            id: { not: novelId },
            status: { not: "HIDDEN" },
            genres: {
                some: {
                    id: { in: genreIds }
                }
            }
        },
        take: 50, // Fetch a pool of candidates
        include: {
            genres: { select: { id: true, name: true } }
        }
    });

    // 3. Score candidates
    const scored = candidates.map(novel => {
        let score = 0;

        // +10 points for each shared genre
        const sharedGenres = novel.genres.filter(g => genreIds.includes(g.id)).length;
        score += sharedGenres * 10;

        // +50 points for same author
        if (novel.author === currentNovel.author) {
            score += 50;
        }

        // +1 point for every 10k views (capped at 20 points) to add a slight popularity bias
        score += Math.min(Math.floor(novel.viewCount / 10000), 20);

        return { ...novel, score };
    });

    // 4. Sort by score desc
    scored.sort((a, b) => b.score - a.score);

    // 5. Take top N
    const related = scored.slice(0, limit);

    // 6. Fallback: If not enough related, fill with Top Viewed
    if (related.length < limit) {
        const existingIds = [novelId, ...related.map(n => n.id)];
        const additional = await db.novel.findMany({
            where: {
                id: { notIn: existingIds },
                status: { not: "HIDDEN" }
            },
            orderBy: { viewCount: "desc" },
            take: limit - related.length,
            select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                author: true,
                genres: {
                    take: 1,
                    select: { name: true }
                }
            }
        });

        // Combine and return
        return [...related, ...additional].map(n => ({
            id: n.id,
            title: n.title,
            slug: n.slug,
            coverImage: n.coverImage,
            author: n.author,
            genres: n.genres
        }));
    }

    // Return with consistent shape
    return related.map(n => ({
        id: n.id,
        title: n.title,
        slug: n.slug,
        coverImage: n.coverImage,
        author: n.author,
        genres: n.genres
    }));
}
