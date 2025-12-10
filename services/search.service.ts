import { api } from "@/lib/api-client";

// Search result item type
export interface SearchNovelItem {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
}

// Full novel result with genres
export interface SearchNovelFull extends SearchNovelItem {
    status: string;
    description: string;
    genres: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
}

// Paginated search response
export interface SearchResponse {
    items: SearchNovelFull[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Search parameters
export interface SearchParams {
    q?: string;
    genres?: string[];
    status?: "ONGOING" | "COMPLETED" | "";
    sort?: "latest" | "updated" | "az" | "popular" | "rating";
    page?: number;
    limit?: number;
}

/**
 * Search Service
 * FE service layer for search API calls
 */
export const searchService = {
    /**
     * Quick search for autocomplete
     * Returns up to 5 results with minimal data
     */
    quickSearch: (query: string) =>
        api.get<SearchNovelItem[]>("/api/search", { q: query, quick: true }),

    /**
     * Advanced search with filters
     */
    search: (params: SearchParams) => {
        const queryParams: Record<string, unknown> = {
            q: params.q,
            status: params.status,
            sort: params.sort,
            page: params.page,
            limit: params.limit,
        };

        // Join genres array into comma-separated string
        if (params.genres && params.genres.length > 0) {
            queryParams.genres = params.genres.join(",");
        }

        return api.get<SearchResponse>("/api/search", queryParams);
    },
};
