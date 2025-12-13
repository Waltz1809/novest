import { db } from "@/lib/db";

/**
 * Check if a user can edit a novel (ownership or collaboration)
 * Returns true if:
 * - User is the uploader (owner)
 * - User is a collaborator
 * - User is Admin or Moderator
 */
export async function canEditNovel(userId: string, novelId: number): Promise<boolean> {
    if (!userId || !novelId) return false;

    const novel = await db.novel.findUnique({
        where: { id: novelId },
        select: {
            uploaderId: true,
            collaborators: {
                where: { userId },
                select: { id: true }
            }
        }
    });

    if (!novel) return false;

    // Owner can always edit
    if (novel.uploaderId === userId) return true;

    // Collaborator can edit
    if (novel.collaborators.length > 0) return true;

    // Check for admin/mod role
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    if (user?.role === "ADMIN" || user?.role === "MODERATOR") return true;

    return false;
}

/**
 * Check if user is the owner of a novel (for destructive actions)
 * Only owner can: delete novel, transfer ownership, manage collaborators
 */
export async function isNovelOwner(userId: string, novelId: number): Promise<boolean> {
    if (!userId || !novelId) return false;

    const novel = await db.novel.findUnique({
        where: { id: novelId },
        select: { uploaderId: true }
    });

    return novel?.uploaderId === userId;
}

/**
 * Check if user is a collaborator (not owner)
 */
export async function isNovelCollaborator(userId: string, novelId: number): Promise<boolean> {
    if (!userId || !novelId) return false;

    const collab = await db.novelCollaborator.findUnique({
        where: {
            novelId_userId: { novelId, userId }
        }
    });

    return !!collab;
}

/**
 * Get all collaborators for a novel
 */
export async function getNovelCollaborators(novelId: number) {
    return db.novelCollaborator.findMany({
        where: { novelId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    nickname: true,
                    username: true,
                    image: true
                }
            }
        },
        orderBy: { addedAt: "asc" }
    });
}

const MAX_COLLABORATORS = 10;

/**
 * Add a collaborator to a novel
 * Only the owner can add collaborators
 * Limit: 10 collaborators per novel
 */
export async function addCollaborator(
    ownerId: string,
    novelId: number,
    collaboratorUserId: string
): Promise<{ success?: string; error?: string }> {
    // Check ownership
    if (!await isNovelOwner(ownerId, novelId)) {
        return { error: "Chỉ chủ sở hữu mới có thể thêm phó thớt" };
    }

    // Check if already a collaborator
    const existing = await db.novelCollaborator.findUnique({
        where: { novelId_userId: { novelId, userId: collaboratorUserId } }
    });
    if (existing) {
        return { error: "Người dùng đã là phó thớt" };
    }

    // Check limit
    const count = await db.novelCollaborator.count({ where: { novelId } });
    if (count >= MAX_COLLABORATORS) {
        return { error: `Tối đa ${MAX_COLLABORATORS} phó thớt mỗi truyện` };
    }

    // Cannot add owner as collaborator
    const novel = await db.novel.findUnique({
        where: { id: novelId },
        select: { uploaderId: true, title: true }
    });
    if (novel?.uploaderId === collaboratorUserId) {
        return { error: "Không thể thêm chủ sở hữu làm phó thớt" };
    }

    // Check if user exists
    const collaborator = await db.user.findUnique({
        where: { id: collaboratorUserId },
        select: { id: true, nickname: true, name: true }
    });
    if (!collaborator) {
        return { error: "Không tìm thấy người dùng" };
    }

    // Add collaborator
    await db.novelCollaborator.create({
        data: {
            novelId,
            userId: collaboratorUserId
        }
    });

    // Send notification to the new collaborator
    await db.notification.create({
        data: {
            userId: collaboratorUserId,
            actorId: ownerId,
            type: "COLLABORATOR_ADDED",
            resourceId: String(novelId),
            resourceType: "NOVEL",
            message: `Bạn đã được thêm làm phó thớt cho truyện "${novel?.title}"`
        }
    });

    return { success: "Đã thêm phó thớt thành công" };
}

/**
 * Remove a collaborator from a novel
 * Only the owner can remove collaborators
 */
export async function removeCollaborator(
    ownerId: string,
    novelId: number,
    collaboratorUserId: string
): Promise<{ success?: string; error?: string }> {
    // Check ownership
    if (!await isNovelOwner(ownerId, novelId)) {
        return { error: "Chỉ chủ sở hữu mới có thể xóa phó thớt" };
    }

    // Check if collaborator exists
    const existing = await db.novelCollaborator.findUnique({
        where: { novelId_userId: { novelId, userId: collaboratorUserId } }
    });
    if (!existing) {
        return { error: "Người dùng không phải phó thớt" };
    }

    // Get novel info for notification
    const novel = await db.novel.findUnique({
        where: { id: novelId },
        select: { title: true }
    });

    // Remove collaborator
    await db.novelCollaborator.delete({
        where: { novelId_userId: { novelId, userId: collaboratorUserId } }
    });

    // Send notification to the removed collaborator
    await db.notification.create({
        data: {
            userId: collaboratorUserId,
            actorId: ownerId,
            type: "COLLABORATOR_REMOVED",
            resourceId: String(novelId),
            resourceType: "NOVEL",
            message: `Bạn đã bị xóa khỏi vai trò phó thớt của truyện "${novel?.title}"`
        }
    });

    return { success: "Đã xóa phó thớt" };
}

/**
 * Notify owner when collaborator makes edits
 */
export async function notifyOwnerOfCollaboratorEdit(
    collaboratorId: string,
    novelId: number,
    action: string // e.g., "đã chỉnh sửa chương", "đã thêm chương mới"
) {
    const novel = await db.novel.findUnique({
        where: { id: novelId },
        select: { uploaderId: true, title: true }
    });

    if (!novel || novel.uploaderId === collaboratorId) return;

    const collaborator = await db.user.findUnique({
        where: { id: collaboratorId },
        select: { nickname: true, name: true }
    });

    const displayName = collaborator?.nickname || collaborator?.name || "Phó thớt";

    await db.notification.create({
        data: {
            userId: novel.uploaderId,
            actorId: collaboratorId,
            type: "COLLABORATOR_EDIT",
            resourceId: String(novelId),
            resourceType: "NOVEL",
            message: `${displayName} ${action} trên truyện "${novel.title}"`
        }
    });
}
