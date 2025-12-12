"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
    getNovelCollaborators,
    addCollaborator,
    removeCollaborator,
    isNovelOwner
} from "@/lib/novel-permissions";
import { db } from "@/lib/db";

/**
 * Get all collaborators for a novel (public action)
 */
export async function getCollaboratorsAction(novelId: number) {
    try {
        const collaborators = await getNovelCollaborators(novelId);
        return { collaborators };
    } catch (error) {
        console.error("Get collaborators error:", error);
        return { error: "Không thể tải danh sách phó thớt", collaborators: [] };
    }
}

/**
 * Add a collaborator by username
 */
export async function addCollaboratorAction(novelId: number, username: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    if (!username?.trim()) {
        return { error: "Vui lòng nhập username" };
    }

    try {
        // Find user by username
        const collaboratorUser = await db.user.findUnique({
            where: { username: username.trim() },
            select: { id: true }
        });

        if (!collaboratorUser) {
            return { error: "Không tìm thấy người dùng với username này" };
        }

        const result = await addCollaborator(session.user.id, novelId, collaboratorUser.id);

        if (result.success) {
            revalidatePath(`/studio/novels/edit/${novelId}`);
        }

        return result;
    } catch (error) {
        console.error("Add collaborator error:", error);
        return { error: "Lỗi khi thêm phó thớt" };
    }
}

/**
 * Remove a collaborator
 */
export async function removeCollaboratorAction(novelId: number, collaboratorUserId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const result = await removeCollaborator(session.user.id, novelId, collaboratorUserId);

        if (result.success) {
            revalidatePath(`/studio/novels/edit/${novelId}`);
        }

        return result;
    } catch (error) {
        console.error("Remove collaborator error:", error);
        return { error: "Lỗi khi xóa phó thớt" };
    }
}

/**
 * Check if current user is the owner (for UI permissions)
 */
export async function checkIsOwnerAction(novelId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { isOwner: false };
    }

    const isOwner = await isNovelOwner(session.user.id, novelId);
    return { isOwner };
}

/**
 * Search users by username for adding as collaborator
 */
export async function searchUsersForCollaborator(novelId: number, query: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { users: [] };
    }

    if (!query || query.length < 2) {
        return { users: [] };
    }

    try {
        // Get novel to exclude owner and existing collaborators
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: {
                uploaderId: true,
                collaborators: { select: { userId: true } }
            }
        });

        if (!novel) return { users: [] };

        const excludeIds = [
            novel.uploaderId,
            ...novel.collaborators.map(c => c.userId)
        ];

        const users = await db.user.findMany({
            where: {
                AND: [
                    { id: { notIn: excludeIds } },
                    {
                        OR: [
                            { username: { contains: query, mode: "insensitive" } },
                            { nickname: { contains: query, mode: "insensitive" } },
                            { name: { contains: query, mode: "insensitive" } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                username: true,
                nickname: true,
                name: true,
                image: true
            },
            take: 10
        });

        return { users };
    } catch (error) {
        console.error("Search users error:", error);
        return { users: [] };
    }
}
