/**
 * Standard API Response Types
 * Used by all API routes and service callers
 */

// Base API response structure
export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};

// Pagination response
export type PaginatedResponse<T> = ApiResponse<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}>;

// Genre types
export interface Genre {
    id: number;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface GenreWithCount extends Genre {
    _count: {
        novels: number;
    };
}

// Novel types (basic - expand as needed)
export interface NovelBasic {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
    status: string;
    approvalStatus: string;
}

// User types (basic - expand as needed)
export interface UserBasic {
    id: string;
    name: string | null;
    nickname: string | null;
    username: string | null;
    image: string | null;
}

// Common request types
export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface SearchParams extends PaginationParams {
    q?: string;
}
