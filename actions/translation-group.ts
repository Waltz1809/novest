"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Create a new translation group
 */
export async function createTranslationGroup(name: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    if (!name || name.trim().length < 2) {
        return { error: "Tên nhóm phải có ít nhất 2 ký tự" };
    }

    try {
        const group = await db.translationGroup.create({
            data: {
                name: name.trim(),
                members: {
                    create: {
                        userId: session.user.id,
                        role: "OWNER",
                    },
                },
            },
        });

        revalidatePath("/studio");
        return { success: true, groupId: group.id };
    } catch (error) {
        console.error("Error creating translation group:", error);
        return { error: "Lỗi khi tạo nhóm dịch" };
    }
}

/**
 * Get groups that user belongs to
 */
export async function getMyGroups() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const memberships = await db.translationGroupMember.findMany({
            where: { userId: session.user.id },
            include: {
                group: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        nickname: true,
                                        image: true,
                                    },
                                },
                            },
                        },
                        _count: {
                            select: { novels: true },
                        },
                    },
                },
            },
            orderBy: { joinedAt: "desc" },
        });

        return memberships.map((m) => ({
            ...m.group,
            myRole: m.role,
        }));
    } catch (error) {
        console.error("Error fetching user groups:", error);
        return [];
    }
}

/**
 * Add member to a group (owner/admin only)
 */
export async function addGroupMember(groupId: string, userId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        // Check if current user is owner or admin of the group
        const membership = await db.translationGroupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: session.user.id,
                },
            },
        });

        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            return { error: "Bạn không có quyền thêm thành viên" };
        }

        // Check if target user exists
        const targetUser = await db.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!targetUser) {
            return { error: "Không tìm thấy người dùng" };
        }

        // Check if already a member
        const existingMembership = await db.translationGroupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId,
                },
            },
        });

        if (existingMembership) {
            return { error: "Người dùng đã là thành viên của nhóm" };
        }

        await db.translationGroupMember.create({
            data: {
                groupId,
                userId,
                role: "MEMBER",
            },
        });

        revalidatePath("/studio");
        return { success: true };
    } catch (error) {
        console.error("Error adding group member:", error);
        return { error: "Lỗi khi thêm thành viên" };
    }
}

/**
 * Remove member from group (owner/admin only, or self-removal)
 */
export async function removeGroupMember(groupId: string, userId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        // Self-removal is always allowed (except for owner)
        const isSelfRemoval = userId === session.user.id;

        if (isSelfRemoval) {
            const membership = await db.translationGroupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId,
                        userId: session.user.id,
                    },
                },
            });

            if (membership?.role === "OWNER") {
                return { error: "Chủ nhóm không thể rời nhóm. Hãy chuyển quyền trước." };
            }
        } else {
            // Check if current user is owner or admin
            const myMembership = await db.translationGroupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId,
                        userId: session.user.id,
                    },
                },
            });

            if (!myMembership || (myMembership.role !== "OWNER" && myMembership.role !== "ADMIN")) {
                return { error: "Bạn không có quyền xóa thành viên" };
            }

            // Cannot remove owner
            const targetMembership = await db.translationGroupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId,
                        userId,
                    },
                },
            });

            if (targetMembership?.role === "OWNER") {
                return { error: "Không thể xóa chủ nhóm" };
            }
        }

        await db.translationGroupMember.delete({
            where: {
                groupId_userId: {
                    groupId,
                    userId,
                },
            },
        });

        revalidatePath("/studio");
        return { success: true };
    } catch (error) {
        console.error("Error removing group member:", error);
        return { error: "Lỗi khi xóa thành viên" };
    }
}

/**
 * Assign/remove novel from translation group (uploader only)
 */
export async function setNovelGroup(novelId: number, groupId: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Chưa đăng nhập" };
    }

    try {
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: { uploaderId: true },
        });

        if (!novel) {
            return { error: "Không tìm thấy truyện" };
        }

        // Only uploader can assign group
        if (novel.uploaderId !== session.user.id) {
            return { error: "Chỉ người đăng truyện mới có thể đặt nhóm dịch" };
        }

        // If assigning to a group, verify user is a member
        if (groupId) {
            const membership = await db.translationGroupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId,
                        userId: session.user.id,
                    },
                },
            });

            if (!membership) {
                return { error: "Bạn không phải thành viên của nhóm này" };
            }
        }

        await db.novel.update({
            where: { id: novelId },
            data: { translationGroupId: groupId },
        });

        revalidatePath(`/studio/novels/edit/${novelId}`);
        return { success: true };
    } catch (error) {
        console.error("Error setting novel group:", error);
        return { error: "Lỗi khi đặt nhóm dịch" };
    }
}

/**
 * Check if user has edit access to a novel (uploader or group member)
 */
export async function checkNovelEditAccess(novelId: number, userId: string): Promise<boolean> {
    try {
        const novel = await db.novel.findUnique({
            where: { id: novelId },
            select: {
                uploaderId: true,
                translationGroupId: true,
            },
        });

        if (!novel) return false;

        // Uploader always has access
        if (novel.uploaderId === userId) return true;

        // Check group membership
        if (novel.translationGroupId) {
            const membership = await db.translationGroupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId: novel.translationGroupId,
                        userId,
                    },
                },
            });

            return !!membership;
        }

        return false;
    } catch (error) {
        console.error("Error checking novel edit access:", error);
        return false;
    }
}

/**
 * Search users by username/name for adding to group
 */
export async function searchUsersForGroup(query: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    if (!query || query.length < 2) {
        return [];
    }

    try {
        const users = await db.user.findMany({
            where: {
                OR: [
                    { username: { contains: query } },
                    { name: { contains: query } },
                    { nickname: { contains: query } },
                ],
                id: { not: session.user.id }, // Exclude self
            },
            select: {
                id: true,
                name: true,
                nickname: true,
                username: true,
                image: true,
            },
            take: 10,
        });

        return users;
    } catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
}
