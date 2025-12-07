/**
 * Ticket type definitions and constants
 * Shared between server actions and client components
 */

// Ticket main types
export const TICKET_MAIN_TYPES = {
    REPORT: "REPORT",
    BUG: "BUG",
    SUPPORT: "SUPPORT",
    FIX_CHAPTER: "FIX_CHAPTER",
    STATUS_CHANGE: "STATUS_CHANGE",
} as const;

// Ticket sub types
export const TICKET_SUB_TYPES = {
    // For REPORT
    NOVEL_QUALITY: "NOVEL_QUALITY",
    SPAM_COMMENT: "SPAM_COMMENT",
    TOS_VIOLATION: "TOS_VIOLATION",
    COPYRIGHT: "COPYRIGHT",
    // For STATUS_CHANGE
    REQUEST_COMPLETE: "REQUEST_COMPLETE",
    REQUEST_HIATUS: "REQUEST_HIATUS",
    REQUEST_DROPPED: "REQUEST_DROPPED",
} as const;

// Ticket statuses
export const TICKET_STATUSES = {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED",
} as const;

// Vietnamese labels
export const TICKET_TYPE_LABELS: Record<string, string> = {
    REPORT: "Báo cáo",
    BUG: "Lỗi hệ thống",
    SUPPORT: "Hỗ trợ",
    FIX_CHAPTER: "Sửa chương",
    STATUS_CHANGE: "Yêu cầu đổi trạng thái",
};

export const TICKET_SUBTYPE_LABELS: Record<string, string> = {
    NOVEL_QUALITY: "Chất lượng truyện kém",
    SPAM_COMMENT: "Bình luận spam",
    TOS_VIOLATION: "Vi phạm điều khoản",
    COPYRIGHT: "Vi phạm bản quyền",
    REQUEST_COMPLETE: "Yêu cầu đánh dấu hoàn thành",
    REQUEST_HIATUS: "Yêu cầu tạm dừng",
    REQUEST_DROPPED: "Yêu cầu ngưng dịch",
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
    OPEN: "Mở",
    IN_PROGRESS: "Đang xử lý",
    RESOLVED: "Đã giải quyết",
    CLOSED: "Đã đóng",
};

// Type aliases
export type TicketMainType = keyof typeof TICKET_MAIN_TYPES;
export type TicketSubType = keyof typeof TICKET_SUB_TYPES;
export type TicketStatus = keyof typeof TICKET_STATUSES;
