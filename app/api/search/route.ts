import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toSlug } from "@/lib/utils";

/**
 * GET /api/search - Search novels
 * Public endpoint
 * 
 * Query params:
 * - q: string - search query (required)
 * - genres: string - comma-separated genre slugs (optional)
 * - status: string - ONGOING | COMPLETED (optional)
 * - sort: string - latest | updated | az (optional, default: latest)
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 24)
 * - quick: boolean - if true, returns limited results for autocomplete (optional)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const query = searchParams.get("q") || "";
        const genresParam = searchParams.get("genres") || "";
        const status = searchParams.get("status") || "";
        const sort = searchParams.get("sort") || "latest";
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "24", 10);
        const isQuickSearch = searchParams.get("quick") === "true";

        // Quick search for autocomplete (simplified response)
        if (isQuickSearch) {
            if (!query) {
                return NextResponse.json({
                    success: true,
                    data: []
                });
            }

            const normalizedQuery = toSlug(query).replace(/-/g, " ");

            const novels = await db.novel.findMany({
                where: {
                    approvalStatus: "APPROVED",
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

            return NextResponse.json({
                success: true,
                data: novels
            });
        }

        // Advanced search with filters
        const genreSlugs = genresParam ? genresParam.split(",").filter(Boolean) : [];
        const skip = (page - 1) * limit;

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            approvalStatus: "APPROVED",
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let orderBy: any = {};
        switch (sort) {
            case "updated":
                orderBy = { updatedAt: "desc" };
                break;
            case "az":
                orderBy = { title: "asc" };
                break;
            case "popular":
                orderBy = { viewCount: "desc" };
                break;
            case "rating":
                orderBy = { ratingCount: "desc" };
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
                take: limit,
            }),
            db.novel.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items: novels,
                total: totalCount,
                page,
                limit,
                hasMore: skip + limit < totalCount,
            }
        });
    } catch (error) {
        console.error("GET /api/search error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tìm kiếm" },
            { status: 500 }
        );
    }
}
