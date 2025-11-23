"use server";

import { db } from "@/lib/db";
import { toSlug } from "@/lib/utils";

export async function searchNovels(query: string) {
    if (!query) return [];

    const normalizedQuery = toSlug(query).replace(/-/g, " ");

    const novels = await db.novel.findMany({
        where: {
            searchIndex: {
                contains: normalizedQuery,
            },
        },
        select: {
            id: true,
            title: true,
            slug: true,
            author: true,
            coverImage: true,
        },
        take: 5,
    });

    return novels;
}

export async function getGenres() {
    const genres = await db.genre.findMany({
        orderBy: {
            name: "asc",
        },
    });
    return genres;
}
