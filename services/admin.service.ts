import { api } from "@/lib/api-client";

// Admin user item
export interface AdminUserItem {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    nickname: string | null;
    username: string | null;
    createdAt: string;
    isBanned: boolean;
    _count: {
        comments: number;
    };
}

// Admin novel item
export interface AdminNovelItem {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
    approvalStatus: string;
    createdAt: string;
    uploader: {
        id: string;
        name: string | null;
        nickname: string | null;
    };
    _count: {
        comments: number;
    };
}

// Admin comment item
export interface AdminCommentItem {
    id: number;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        image: string | null;
        nickname: string | null;
    };
    novel: {
        id: number;
        title: string;
        slug: string;
    };
    chapter: {
        id: number;
        title: string;
    } | null;
}

// Admin ticket item
export interface AdminTicketItem {
    id: string;
    subject: string;
    content: string;
    status: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        nickname: string | null;
    };
}

// Admin stats
export interface AdminStats {
    totalUsers: number;
    totalComments: number;
    totalNovels: number;
    openTickets: number;
    pendingNovels: number;
    bannedUsers: number;
    totalRatings: number;
}

// Paginated response
export interface AdminPaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
}

// List params - use index signature for compatibility
export interface AdminListParams {
    [key: string]: unknown;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

/**
 * Admin Service
 * FE service layer for admin API calls
 */
export const adminService = {
    // Stats
    getStats: () =>
        api.get<AdminStats>("/api/admin/stats"),

    // Users
    getUsers: (params: AdminListParams = {}) =>
        api.get<AdminPaginatedResponse<AdminUserItem>>("/api/admin/users", params),

    updateUserRole: (userId: string, role: string) =>
        api.patch<void>("/api/admin/users", { userId, action: "updateRole", role }),

    banUser: (userId: string, reason?: string) =>
        api.patch<void>("/api/admin/users", { userId, action: "ban", reason }),

    unbanUser: (userId: string) =>
        api.patch<void>("/api/admin/users", { userId, action: "unban" }),

    // Novels
    getNovels: (params: AdminListParams = {}) =>
        api.get<AdminPaginatedResponse<AdminNovelItem>>("/api/admin/novels", params),

    approveNovel: (novelId: number) =>
        api.patch<void>("/api/admin/novels", { novelId, action: "approve" }),

    rejectNovel: (novelId: number, reason?: string) =>
        api.patch<void>("/api/admin/novels", { novelId, action: "reject", reason }),

    deleteNovel: (novelId: number) =>
        api.patch<void>("/api/admin/novels", { novelId, action: "delete" }),

    // Comments
    getComments: (params: AdminListParams = {}) =>
        api.get<AdminPaginatedResponse<AdminCommentItem>>("/api/admin/comments", params),

    deleteComment: (commentId: number) =>
        api.deleteWithBody<void>("/api/admin/comments", { commentId }),

    // Tickets
    getTickets: (params: AdminListParams = {}) =>
        api.get<AdminPaginatedResponse<AdminTicketItem>>("/api/admin/tickets", params),

    updateTicketStatus: (ticketId: string, status: string) =>
        api.patch<void>("/api/admin/tickets", { ticketId, status }),
};
