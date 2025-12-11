/**
 * Services Index
 * Export all API service modules for easy importing
 * 
 * Usage:
 * import { novelService, genreService, adminService } from "@/services";
 */

// Core services
export { genreService } from "./genre.service";
export { searchService } from "./search.service";
export { rankingService } from "./ranking.service";
export { novelService } from "./novel.service";

// User services
export { notificationService } from "./notification.service";
export { libraryService } from "./library.service";
export { userService } from "./user.service";

// Interaction services
export { commentService } from "./comment.service";

// Content services
export { chapterService } from "./chapter.service";
export { ratingService } from "./rating.service";

// Admin services
export { adminService } from "./admin.service";

// Re-export types
export type { Genre, GenreWithCount } from "@/types/api";

export type {
    SearchNovelItem,
    SearchNovelFull,
    SearchResponse,
    SearchParams,
} from "./search.service";

export type {
    RankingType,
    RankingNovel,
    ViewRankingNovel,
    RatingRankingNovel,
    DateRankingNovel,
    RankingParams,
} from "./ranking.service";

export type {
    NovelListItem,
    NovelDetail,
    NovelListResponse,
    NovelDto,
    NovelListParams,
} from "./novel.service";

export type {
    NotificationItem,
    NotificationListResponse,
    NotificationListParams,
} from "./notification.service";

export type {
    LibraryNovelItem,
    LibraryUpdateItem,
    LibraryListResponse,
    LibraryListParams,
} from "./library.service";

export type { UserProfile } from "./user.service";

export type {
    CommentItem,
    CommentUser,
    CommentListResponse,
    CommentListParams,
    CreateCommentParams,
} from "./comment.service";

export type {
    AdminUserItem,
    AdminNovelItem,
    AdminCommentItem,
    AdminTicketItem,
    AdminStats,
    AdminPaginatedResponse,
    AdminListParams,
} from "./admin.service";
