import { api } from "@/lib/api-client";

// Chapter item
export interface ChapterItem {
    id: number;
    title: string;
    slug: string;
    order: number;
    wordCount: number;
    isLocked: boolean;
    price: number | null;
    createdAt: string;
    content?: string;
}

// Volume with chapters
export interface VolumeWithChapters {
    id: number;
    title: string;
    order: number;
    chapters: ChapterItem[];
}

// Chapters list response
export interface ChaptersListResponse {
    novelId: number;
    novelTitle: string;
    volumes: VolumeWithChapters[];
}

// Chapter detail response
export interface ChapterDetailResponse {
    id: number;
    title: string;
    slug: string;
    content: string;
    order: number;
    wordCount: number;
    isLocked: boolean;
    price: number | null;
    isDraft: boolean;
    createdAt: string;
    volume: {
        id: number;
        title: string;
        novel: {
            id: number;
            title: string;
            slug: string;
            uploaderId: string;
        };
    };
}

// Create chapter params
export interface CreateChapterParams {
    volumeId: number;
    title: string;
    content?: string;
    order?: number;
    slug?: string;
    isDraft?: boolean;
}

// Update chapter params
export interface UpdateChapterParams {
    title?: string;
    content?: string;
    order?: number;
    slug?: string;
    isDraft?: boolean;
    isLocked?: boolean;
    price?: number;
}

/**
 * Chapter Service
 * FE service layer for chapter API calls
 */
export const chapterService = {
    /**
     * Get all chapters for a novel (organized by volumes)
     */
    getAll: (novelSlug: string, includeContent?: boolean) =>
        api.get<ChaptersListResponse>(`/api/novels/${novelSlug}/chapters`, {
            includeContent: includeContent ? "true" : undefined
        }),

    /**
     * Get a single chapter by ID
     */
    getById: (id: number) =>
        api.get<ChapterDetailResponse>(`/api/chapters/${id}`),

    /**
     * Create a new chapter
     */
    create: (novelSlug: string, data: CreateChapterParams) =>
        api.post<ChapterItem>(`/api/novels/${novelSlug}/chapters`, data),

    /**
     * Update a chapter
     */
    update: (id: number, data: UpdateChapterParams) =>
        api.patch<ChapterItem>(`/api/chapters/${id}`, data),

    /**
     * Delete a chapter
     */
    delete: (id: number) =>
        api.delete<void>(`/api/chapters/${id}`),
};
