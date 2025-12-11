import { api } from "@/lib/api-client";

// Library novel item
export interface LibraryNovelItem {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
    status: string;
    followedAt: string;
}

// Library update item (novel with new chapters)
export interface LibraryUpdateItem {
    novelId: number;
    title: string;
    slug: string;
    coverImage: string | null;
    latestChapter: {
        id: number;
        title: string;
        slug: string;
    };
    nextChapterSlug: string; // For smart routing to next unread chapter
    newChaptersCount: number;
    lastReadAt: string;
}

// Library list response
export interface LibraryListResponse {
    items: LibraryNovelItem[] | LibraryUpdateItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// List params
export interface LibraryListParams {
    [key: string]: unknown;
    page?: number;
    limit?: number;
    withUpdates?: boolean;
}

/**
 * Library Service
 * FE service layer for library (followed novels) API calls
 */
export const libraryService = {
    /**
     * Get paginated library
     */
    getAll: (params: LibraryListParams = {}) =>
        api.get<LibraryListResponse>("/api/library", params),

    /**
     * Get novels with updates since follow
     */
    getUpdates: (params: Omit<LibraryListParams, "withUpdates"> = {}) =>
        api.get<LibraryListResponse>("/api/library", { ...params, withUpdates: true }),

    /**
     * Get count of novels with updates (for badge)
     */
    getUpdateCount: async (): Promise<number> => {
        const response = await api.get<LibraryListResponse>("/api/library", { withUpdates: true, limit: 999 });
        return response.data?.total ?? 0;
    },

    /**
     * Add novel to library (follow)
     */
    follow: (novelId: number) =>
        api.post<void>("/api/library", { novelId }),

    /**
     * Remove novel from library (unfollow)
     */
    unfollow: (novelId: number) =>
        api.deleteWithBody<void>("/api/library", { novelId }),

    /**
     * Check if a novel is in library
     */
    isFollowing: async (novelId: number): Promise<boolean> => {
        const response = await api.get<LibraryListResponse>("/api/library", { limit: 1000 });
        if (!response.success || !response.data) return false;
        return (response.data.items as LibraryNovelItem[]).some(item => item.id === novelId);
    },

    /**
     * Mark single novel as read (update lastReadAt)
     */
    markAsRead: (novelId: number) =>
        api.patch<void>("/api/library/read", { novelId }),

    /**
     * Mark all library entries as read
     */
    markAllAsRead: () =>
        api.patch<void>("/api/library/read", { all: true }),
};

