import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeParseIntClamped } from "@/lib/api-utils";

/**
 * GET /api/rankings - Get novel rankings
 * Public endpoint
 * 
 * Query params:
 * - type: string - "views" | "rating" | "latest" | "updated" (default: views)
 * - limit: number (default: 10, max: 50)
 * - includeR18: boolean (default: false)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const type = searchParams.get("type") || "views";
        const limit = safeParseIntClamped(searchParams.get("limit"), 10, 1, 50);
        const includeR18 = searchParams.get("includeR18") === "true";

        // Base where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            approvalStatus: "APPROVED",
        };

        if (!includeR18) {
            where.isR18 = false;
        }

        switch (type) {
            case "rating": {
                // Get novels with ratings and calculate average
                const novelsWithRatings = await db.novel.findMany({
                    where,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        author: true,
                        coverImage: true,
                        ratings: {
                            select: {
                                score: true,
                            },
                        },
                    },
                });

                // Calculate average rating for each novel
                const ranked = novelsWithRatings
                    .map((novel) => {
                        const totalScore = novel.ratings.reduce((sum, r) => sum + r.score, 0);
                        const ratingCount = novel.ratings.length;
                        const averageRating = ratingCount > 0 ? totalScore / ratingCount : 0;

                        return {
                            id: novel.id,
                            title: novel.title,
                            slug: novel.slug,
                            author: novel.author,
                            coverImage: novel.coverImage,
                            averageRating: Number(averageRating.toFixed(2)),
                            ratingCount,
                        };
                    })
                    .filter((novel) => novel.ratingCount > 0)
                    .sort((a, b) => {
                        if (b.averageRating !== a.averageRating) {
                            return b.averageRating - a.averageRating;
                        }
                        return b.ratingCount - a.ratingCount;
                    })
                    .slice(0, limit);

                return NextResponse.json({
                    success: true,
                    data: ranked
                });
            }

            case "latest": {
                const novels = await db.novel.findMany({
                    where,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        author: true,
                        coverImage: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: limit,
                });

                return NextResponse.json({
                    success: true,
                    data: novels
                });
            }

            case "updated": {
                const novels = await db.novel.findMany({
                    where,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        author: true,
                        coverImage: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        updatedAt: "desc",
                    },
                    take: limit,
                });

                return NextResponse.json({
                    success: true,
                    data: novels
                });
            }

            case "views":
            default: {
                const novels = await db.novel.findMany({
                    where,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        author: true,
                        coverImage: true,
                        viewCount: true,
                    },
                    orderBy: {
                        viewCount: "desc",
                    },
                    take: limit,
                });

                return NextResponse.json({
                    success: true,
                    data: novels
                });
            }
        }
    } catch (error) {
        console.error("GET /api/rankings error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải bảng xếp hạng" },
            { status: 500 }
        );
    }
}
