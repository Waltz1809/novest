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
    artist?: string;
    description: string;
    status: string;
    coverImage: string;
    alternativeTitles?: string;
    genreIds?: number[];
    nation?: string;
    novelFormat?: string;
}) {
    const session = await auth();
    // Any logged-in user can submit a novel (will be pending approval)
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Check if slug already exists - return user-friendly error
    const existingNovel = await db.novel.findUnique({
        where: { slug: data.slug },
        select: { id: true, title: true },
    });
    if (existingNovel) {
        return {
            error: `Truyện này có lẽ đã có tại Novest rồi. Bạn thử tìm kiếm "${existingNovel.title}" xem nhé!`
        };
    }

    const searchIndex = generateSearchIndex(data.title, data.author, data.alternativeTitles || "");

    const novel = await db.novel.create({
        data: {
            title: data.title,
            slug: data.slug,
            author: data.author,
            artist: data.artist || null,
            description: data.description,
            status: data.status,
            coverImage: data.coverImage,
            alternativeTitles: data.alternativeTitles,
            searchIndex,
            uploaderId: session.user.id,
            approvalStatus: "PENDING", // New novels require approval
            nation: data.nation || "CN",
            novelFormat: data.novelFormat || "WN",
            genres: {
                connect: data.genreIds?.map((id) => ({ id: Number(id) })),
            },
        },
    });

    // Notify all admins and moderators about new novel submission
    try {
        const admins = await db.user.findMany({
            where: {
                role: { in: ["ADMIN", "MODERATOR"] },
            },
            select: { id: true },
        });

        const uploaderName = session.user.nickname || session.user.name || "Người dùng";

        await Promise.all(
            admins.map((admin) =>
                db.notification.create({
                    data: {
                        userId: admin.id,
                        actorId: session.user.id,
                        type: "NEW_NOVEL_SUBMISSION",
                        resourceId: String(novel.id),
                        resourceType: "NOVEL",
                        message: `${uploaderName} đã gửi truyện "${novel.title}" chờ duyệt`,
                    },
                })
            )
        );
    } catch (notifyError) {
        console.error("Failed to notify admins:", notifyError);
        // Don't fail the main action if notification fails
    }

    revalidatePath("/studio/novels");
    revalidatePath("/admin/novels/pending");
    revalidatePath("/");

    return { success: true, novelId: novel.id };
}

export async function updateNovel(id: number, data: {
    title: string;
    slug: string;
    author: string;
    artist?: string;
    description: string;
    status: string;
    coverImage: string;
    alternativeTitles?: string;
    genreIds?: number[];
    nation?: string;
    novelFormat?: string;
}) {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    // Check if user is admin/mod or the uploader
    const novel = await db.novel.findUnique({
        where: { id: Number(id) },
        select: { uploaderId: true, coverImage: true }
    });

    if (!novel) {
        throw new Error("Novel not found");
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    const isUploader = novel.uploaderId === session.user.id;

    if (!isAdmin && !isUploader) {
        throw new Error("Unauthorized");
    }

    const searchIndex = generateSearchIndex(data.title, data.author, data.alternativeTitles || "");

    // Delete old cover image from R2 if it exists and is different
    if (novel.coverImage && novel.coverImage !== data.coverImage) {
        const { deleteFromR2 } = await import("./upload");
        await deleteFromR2(novel.coverImage);
    }

    await db.novel.update({
        where: { id: Number(id) },
        data: {
            title: data.title,
            slug: data.slug,
            author: data.author,
            artist: data.artist || null,
            description: data.description,
            status: data.status,
            coverImage: data.coverImage,
            alternativeTitles: data.alternativeTitles,
            searchIndex,
            nation: data.nation,
            novelFormat: data.novelFormat,
            genres: {
                set: [], // Clear old genres
                connect: data.genreIds?.map((id) => ({ id: Number(id) })),
            },
        },
    });

    revalidatePath("/studio/novels");
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

    revalidatePath("/studio/novels");
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

    revalidatePath("/studio/novels");
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
            approvalStatus: "APPROVED", // Only show approved novels
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
                status: { not: "HIDDEN" },
                approvalStatus: "APPROVED", // Only show approved novels
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

/**
 * Approve a novel submission (Admin/Moderator only)
 */
export async function approveNovel(novelId: number) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Chưa đăng nhập" };
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    if (!isAdmin) {
        return { error: "Không có quyền thực hiện" };
    }

    try {
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: {
                id: true,
                title: true,
                uploaderId: true,
                approvalStatus: true
            }
        });

        if (!novel) {
            return { error: "Không tìm thấy truyện" };
        }

        if (novel.approvalStatus === "APPROVED") {
            return { error: "Truyện đã được duyệt" };
        }

        await db.novel.update({
            where: { id: novelId },
            data: {
                approvalStatus: "APPROVED",
                rejectionReason: null,
            },
        });

        // Send notification to uploader
        if (novel.uploaderId) {
            const { createNotification } = await import("./notification");
            await createNotification({
                userId: novel.uploaderId,
                actorId: session.user.id,
                type: "NOVEL_APPROVED",
                resourceId: String(novel.id),
                resourceType: "NOVEL",
                message: `Truyện "${novel.title}" của bạn đã được duyệt và công khai!`,
            });
        }

        revalidatePath("/admin/novels");
        revalidatePath(`/truyen/${novelId}`);
        revalidatePath("/");

        return { success: "Truyện đã được duyệt thành công" };
    } catch (error) {
        console.error("Approve novel error:", error);
        return { error: "Lỗi khi duyệt truyện" };
    }
}

/**
 * Reject a novel submission (Admin/Moderator only)
 */
export async function rejectNovel(novelId: number, reason: string) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Chưa đăng nhập" };
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    if (!isAdmin) {
        return { error: "Không có quyền thực hiện" };
    }

    if (!reason || reason.trim().length < 10) {
        return { error: "Lý do từ chối phải có ít nhất 10 ký tự" };
    }

    try {
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: {
                id: true,
                title: true,
                uploaderId: true,
                approvalStatus: true,
                rejectionCount: true,
            }
        });

        if (!novel) {
            return { error: "Không tìm thấy truyện" };
        }

        const newRejectionCount = (novel.rejectionCount || 0) + 1;

        // 3 strikes = permanent delete
        if (newRejectionCount >= 3) {
            // Hard delete the novel (cascade will handle related records)
            await db.novel.delete({
                where: { id: novelId },
            });

            // Notify uploader about permanent deletion
            if (novel.uploaderId) {
                const { createNotification } = await import("./notification");
                await createNotification({
                    userId: novel.uploaderId,
                    actorId: session.user.id,
                    type: "NOVEL_PERMANENTLY_DELETED",
                    resourceId: String(novel.id),
                    resourceType: "NOVEL",
                    message: `Truyện "${novel.title}" đã bị xóa vĩnh viễn do bị từ chối lần thứ 3. Lý do: ${reason.trim()}`,
                });
            }

            revalidatePath("/admin/novels");
            revalidatePath("/studio/novels");
            revalidatePath("/");

            return { success: "Truyện đã bị xóa vĩnh viễn (lần từ chối thứ 3)", deleted: true };
        }

        // Otherwise, just reject and increment counter
        await db.novel.update({
            where: { id: novelId },
            data: {
                approvalStatus: "REJECTED",
                rejectionReason: reason.trim(),
                rejectionCount: newRejectionCount,
            },
        });

        // Send notification to uploader
        if (novel.uploaderId) {
            const { createNotification } = await import("./notification");
            await createNotification({
                userId: novel.uploaderId,
                actorId: session.user.id,
                type: "NOVEL_REJECTED",
                resourceId: String(novel.id),
                resourceType: "NOVEL",
                message: `Truyện "${novel.title}" đã bị từ chối (${newRejectionCount}/3). Lý do: ${reason.trim()}`,
            });
        }

        revalidatePath("/admin/novels");
        revalidatePath(`/truyen/${novelId}`);
        revalidatePath("/studio/novels");

        return { success: `Đã từ chối truyện (${newRejectionCount}/3)` };
    } catch (error) {
        console.error("Reject novel error:", error);
        return { error: "Lỗi khi từ chối truyện" };
    }
}

/**
 * Resubmit a rejected novel for approval (Uploader only)
 * Creates a ticket instead of notification to reduce admin notification noise
 */
export async function resubmitNovel(novelId: number, message?: string) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: {
                id: true,
                title: true,
                slug: true,
                uploaderId: true,
                approvalStatus: true,
                rejectionCount: true,
            }
        });

        if (!novel) {
            return { error: "Không tìm thấy truyện" };
        }

        // Only the uploader can resubmit
        if (novel.uploaderId !== session.user.id) {
            return { error: "Chỉ người đăng mới có thể gửi lại yêu cầu duyệt" };
        }

        // Can only resubmit if rejected
        if (novel.approvalStatus !== "REJECTED") {
            return { error: "Chỉ có thể gửi lại truyện đã bị từ chối" };
        }

        // Update novel to pending
        await db.novel.update({
            where: { id: novelId },
            data: {
                approvalStatus: "PENDING",
                // Keep rejection reason for reference
            },
        });

        // Create a ticket for admin review (instead of notification)
        const uploaderName = session.user.nickname || session.user.name || "Người dùng";
        await db.ticket.create({
            data: {
                userId: session.user.id,
                mainType: "APPROVAL_REQUEST",
                title: `Xin duyệt lại: ${novel.title}`,
                description: message || `${uploaderName} xin duyệt lại truyện "${novel.title}" sau khi đã chỉnh sửa. Đây là lần gửi thứ ${(novel.rejectionCount || 0) + 1}.`,
                novelId: novel.id,
                status: "OPEN",
            },
        });

        revalidatePath("/admin/tickets");
        revalidatePath("/admin/novels");
        revalidatePath(`/truyen/${novel.slug}/cho-duyet`);
        revalidatePath("/studio/novels");

        return { success: "Đã gửi yêu cầu duyệt lại. Admin sẽ xem xét trong thời gian sớm nhất." };
    } catch (error) {
        console.error("Resubmit novel error:", error);
        return { error: "Lỗi khi gửi lại yêu cầu duyệt" };
    }
}

/**
 * Get pending novels for admin review
 */
export async function getPendingNovels() {
    const session = await auth();
    if (!session?.user) {
        return { error: "Chưa đăng nhập" };
    }

    const isAdmin = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
    if (!isAdmin) {
        return { error: "Không có quyền thực hiện" };
    }

    try {
        const novels = await db.novel.findMany({
            where: { approvalStatus: "PENDING" },
            include: {
                uploader: {
                    select: { id: true, name: true, username: true, image: true }
                },
                genres: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: { volumes: true }
                }
            },
            orderBy: { createdAt: "asc" }, // Oldest first
        });

        return { novels };
    } catch (error) {
        console.error("Get pending novels error:", error);
        return { error: "Lỗi khi tải danh sách truyện chờ duyệt" };
    }
}
