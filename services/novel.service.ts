import { api } from "@/lib/api-client";

// Novel list item
export interface NovelListItem {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
    status: string;
    approvalStatus: string;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    genres: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
    uploader: {
        id: string;
        name: string | null;
        nickname: string | null;
        username: string | null;
    };
}

// Full novel detail
export interface NovelDetail extends NovelListItem {
    artist: string | null;
    description: string;
    alternativeTitles: string | null;
    nation: string;
    novelFormat: string;
    isR18: boolean;
    isLicensedDrop: boolean;
    translationGroup: {
        id: string;
        name: string;
        slug: string;
    } | null;
    volumes: Array<{
        id: number;
        title: string;
        order: number;
        chapters: Array<{
            id: number;
            title: string;
            slug: string;
            order: number;
            createdAt: string;
        }>;
    }>;
    _count: {
        ratings: number;
        followers: number;
    };
}

// Paginated response
export interface NovelListResponse {
    items: NovelListItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Create/Update DTO
export interface NovelDto {
    title: string;
    slug: string;
    author: string;
    artist?: string;
    description: string;
    status?: string;
    coverImage: string;
    alternativeTitles?: string;
    genreIds?: number[];
    nation?: string;
    novelFormat?: string;
    isR18?: boolean;
    isLicensedDrop?: boolean;
    groupId?: string;
}

// List params
export interface NovelListParams {
    [key: string]: unknown;
    status?: string;
    approvalStatus?: string;
    uploaderId?: string;
    page?: number;
    limit?: number;
}

/**
 * Novel Service
 * FE service layer for novel API calls
 */
export const novelService = {
    /**
     * Get paginated list of novels
     */
    getAll: (params: NovelListParams = {}) =>
        api.get<NovelListResponse>("/api/novels", params),

    /**
     * Get a single novel by slug
     */
    getBySlug: (slug: string) =>
        api.get<NovelDetail>(`/api/novels/${slug}`),

    /**
     * Create a new novel
     */
    create: (data: NovelDto) =>
        api.post<NovelDetail>("/api/novels", data),

    /**
     * Update a novel
     */
    update: (slug: string, data: Partial<NovelDto> & { newSlug?: string }) =>
        api.put<NovelDetail>(`/api/novels/${slug}`, data),

    /**
     * Delete a novel (admin only)
     */
    delete: (slug: string) =>
        api.delete<void>(`/api/novels/${slug}`),

    /**
     * Get novels by uploader
     */
    getByUploader: (uploaderId: string, params: Omit<NovelListParams, "uploaderId"> = {}) =>
        api.get<NovelListResponse>("/api/novels", { ...params, uploaderId }),

    /**
     * Get pending novels (admin only)
     */
    getPending: (params: Omit<NovelListParams, "approvalStatus"> = {}) =>
        api.get<NovelListResponse>("/api/novels", { ...params, approvalStatus: "PENDING" }),
};
