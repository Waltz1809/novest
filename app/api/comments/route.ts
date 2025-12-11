import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { safeParseInt } from "@/lib/api-utils";

/**
 * GET /api/comments - Get comments for a novel/chapter
 * Public endpoint
 * 
 * Query params:
 * - novelId: number (required)
 * - chapterId: number (optional - for chapter comments)
 * - paragraphId: number (optional - for paragraph comments)
 * - parentId: number (optional - for replies to a specific comment)
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * - sort: "newest" | "votes" | "replies" (default: newest)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const novelId = safeParseInt(searchParams.get("novelId"), 0);
        const chapterId = searchParams.get("chapterId");
        const paragraphId = searchParams.get("paragraphId");
        const parentId = searchParams.get("parentId");
        const page = safeParseInt(searchParams.get("page"), 1);
        const limit = safeParseInt(searchParams.get("limit"), 10);
        const sort = searchParams.get("sort") || "newest";
        const skip = (page - 1) * limit;

        if (!novelId) {
            return NextResponse.json(
                { success: false, error: "novelId is required" },
                { status: 400 }
            );
        }

        const session = await auth();
        const chapterDiscussions = searchParams.get("chapterDiscussions") === "true";

        // Special mode: Get newest chapter discussions across the novel
        if (chapterDiscussions) {
            const comments = await db.comment.findMany({
                where: {
                    novelId,
                    chapterId: { not: null },
                    parentId: null,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            username: true,
                            image: true,
                        },
                    },
                    chapter: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            order: true,
                            volume: {
                                select: {
                                    novelId: true,
                                    novel: {
                                        select: { slug: true },
                                    },
                                },
                            },
                        },
                    },
                    reactions: true,
                },
                orderBy: { createdAt: "desc" },
                take: limit,
            });

            const processedComments = comments.map((comment) => {
                const upvotes = comment.reactions.filter((r) => r.type === "UPVOTE").length;
                const downvotes = comment.reactions.filter((r) => r.type === "DOWNVOTE").length;
                const score = upvotes - downvotes;
                const userVote = session?.user?.id
                    ? comment.reactions.find((r) => r.userId === session.user.id)?.type
                    : null;

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { reactions, ...rest } = comment;
                return { ...rest, score, userVote };
            });

            return NextResponse.json({
                success: true,
                data: { items: processedComments },
            });
        }

        // Build where clause
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { novelId };

        if (parentId) {
            // Get replies to a specific comment
            where.parentId = parseInt(parentId, 10);
        } else if (chapterId) {
            where.chapterId = parseInt(chapterId, 10);
            if (paragraphId !== null && paragraphId !== undefined) {
                where.paragraphId = parseInt(paragraphId, 10);
            }
        } else {
            where.chapterId = null;
        }

        // Build order by
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderBy: any[] = [{ isPinned: "desc" }];
        orderBy.push({ createdAt: "desc" });

        const [comments, total] = await Promise.all([
            db.comment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            username: true,
                            image: true,
                        },
                    },
                    parent: {
                        select: {
                            id: true,
                            content: true,
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    nickname: true,
                                    username: true,
                                },
                            },
                        },
                    },
                    reactions: true,
                    _count: {
                        select: { children: true },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            db.comment.count({ where }),
        ]);

        // Process comments to add score and userVote
        const processedComments = comments.map((comment) => {
            const upvotes = comment.reactions.filter((r) => r.type === "UPVOTE").length;
            const downvotes = comment.reactions.filter((r) => r.type === "DOWNVOTE").length;
            const score = upvotes - downvotes;
            const userVote = session?.user?.id
                ? comment.reactions.find((r) => r.userId === session.user.id)?.type
                : null;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { reactions, _count, ...rest } = comment;
            return {
                ...rest,
                score,
                userVote,
                replyCount: _count?.children || 0,
            };
        });

        // Sort by score or replies if needed (post-fetch)
        if (sort === "votes") {
            processedComments.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return b.score - a.score;
            });
        } else if (sort === "replies") {
            processedComments.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return b.replyCount - a.replyCount;
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                items: processedComments,
                total,
                page,
                limit,
                hasMore: skip + limit < total,
            },
        });
    } catch (error) {
        console.error("GET /api/comments error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi tải bình luận" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/comments - Add a new comment
 * Requires authentication
 * 
 * Body: { novelId, content, chapterId?, parentId?, paragraphId? }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { novelId, content, chapterId, parentId, paragraphId } = body;

        if (!novelId || !content?.trim()) {
            return NextResponse.json(
                { success: false, error: "novelId và content là bắt buộc" },
                { status: 400 }
            );
        }

        // Validate novel exists
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: { id: true, slug: true, title: true },
        });

        if (!novel) {
            return NextResponse.json(
                { success: false, error: "Truyện không tồn tại" },
                { status: 404 }
            );
        }

        const comment = await db.comment.create({
            data: {
                content: content.trim(),
                userId: session.user.id,
                novelId,
                chapterId: chapterId || null,
                parentId: parentId || null,
                paragraphId: paragraphId ?? null,
            },
        });

        // Create notification for reply
        if (parentId) {
            const parentComment = await db.comment.findUnique({
                where: { id: parentId },
                select: { userId: true },
            });

            if (parentComment && parentComment.userId !== session.user.id) {
                await db.notification.create({
                    data: {
                        userId: parentComment.userId,
                        actorId: session.user.id,
                        type: "REPLY_COMMENT",
                        resourceId: comment.id.toString(),
                        resourceType: "comment",
                        message: `${session.user.nickname || session.user.name} đã phản hồi bình luận của bạn ở "${novel.title}"`,
                    },
                });
            }
        }

        // Fetch complete comment
        const completeComment = await db.comment.findUnique({
            where: { id: comment.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        username: true,
                        image: true,
                    },
                },
                parent: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                nickname: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        });

        revalidatePath("/");

        return NextResponse.json({
            success: true,
            data: {
                ...completeComment,
                score: 0,
                userVote: null,
                replyCount: 0,
            },
            message: "Đã gửi bình luận",
        }, { status: 201 });
    } catch (error) {
        console.error("POST /api/comments error:", error);
        return NextResponse.json(
            { success: false, error: "Lỗi khi gửi bình luận" },
            { status: 500 }
        );
    }
}
