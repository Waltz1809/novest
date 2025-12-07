"use server";

import { db } from "@/lib/db";
import { toSlug } from "@/lib/utils";

export async function searchNovels(query: string) {
    if (!query) return [];

    const normalizedQuery = toSlug(query).replace(/-/g, " ");

    const novels = await db.novel.findMany({
        where: {
            approvalStatus: "APPROVED", // Only show approved novels
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

interface AdvancedSearchParams {
    query?: string;
    genreSlugs?: string[];
    status?: string;
    sort?: string;
    page?: number;
}

export async function getAdvancedSearchResults({
    query = "",
    genreSlugs = [],
    status,
    sort = "latest",
    page = 1,
}: AdvancedSearchParams) {
    const pageSize = 24;
    const skip = (page - 1) * pageSize;

    // Build where clause - always filter by approved status
    const where: any = {
        approvalStatus: "APPROVED", // Only show approved novels
    };

    // Text search
    if (query) {
        const normalizedQuery = toSlug(query).replace(/-/g, " ");
        where.searchIndex = {
            contains: normalizedQuery,
        };
    }

    // Genre filtering - novels must have ALL selected genres
    if (genreSlugs.length > 0) {
        where.AND = genreSlugs.map(slug => ({
            genres: {
                some: {
                    slug: slug,
                },
            },
        }));
    }

    // Status filtering
    if (status && (status === "ONGOING" || status === "COMPLETED")) {
        where.status = status;
    }

    // Determine sort order
    let orderBy: any = {};
    switch (sort) {
        case "updated":
            orderBy = { updatedAt: "desc" };
            break;
        case "az":
            orderBy = { title: "asc" };
            break;
        case "latest":
        default:
            orderBy = { createdAt: "desc" };
            break;
    }

    // Fetch novels with pagination
    const [novels, totalCount] = await Promise.all([
        db.novel.findMany({
            where,
            include: {
                genres: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
            orderBy,
            skip,
            take: pageSize,
        }),
        db.novel.count({ where }),
    ]);

    return {
        novels,
        totalCount,
        pageSize,
    };
}
