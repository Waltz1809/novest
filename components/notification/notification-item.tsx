"use client";

import { useState } from "react";
import { BookOpen, MessageSquare, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-time";
import { notificationService } from "@/services";
import { getNovelApprovalStatus } from "@/actions/novel";
import { useRouter } from "next/navigation";

interface NotificationItemProps {
    notification: {
        id: string;
        type: string;
        message: string;
        resourceId: string;
        resourceType: string;
        isRead: boolean;
        createdAt: Date | string;
        actor?: {
            name: string | null;
            nickname: string | null;
            image: string | null;
        } | null;
    };
    onClose: () => void;
    onUpdate: () => void;
}

export function NotificationItem({ notification, onClose, onUpdate }: NotificationItemProps) {
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        // Mark as read first
        try {
            await notificationService.markAsRead([notification.id]);
            onUpdate();
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }

        // Smart routing for NEW_NOVEL_SUBMISSION
        if (notification.type === "NEW_NOVEL_SUBMISSION" && notification.resourceId) {
            setIsNavigating(true);
            const approvalStatus = await getNovelApprovalStatus(notification.resourceId);

            if (approvalStatus === "APPROVED") {
                // Novel is already approved, go to normal page
                router.push(`/truyen/${notification.resourceId}`);
            } else {
                // Novel is pending/rejected, go to review page
                router.push(`/truyen/${notification.resourceId}/cho-duyet`);
            }
            onClose();
            return;
        }

        // For other notification types, use static routing
        const link = getLink();
        if (link !== "/") {
            router.push(link);
        }
        onClose();
    };

    // Determine icon based on type
    const getIcon = () => {
        switch (notification.type) {
            case "NEW_CHAPTER":
                return BookOpen;
            case "NOVEL_APPROVED":
                return CheckCircle;
            case "NOVEL_REJECTED":
            case "NOVEL_PERMANENTLY_DELETED":
                return XCircle;
            default:
                return MessageSquare;
        }
    };
    const Icon = getIcon();

    // Construct link based on resource type and notification type (for non-dynamic cases)
    const getLink = () => {
        // For new chapter notifications - resourceType is "chapter", resourceId is the chapter URL
        if (notification.type === "NEW_CHAPTER" && notification.resourceId) {
            return notification.resourceId;
        }

        // For novel-related notifications
        if (notification.resourceType === "NOVEL" && notification.resourceId) {
            // For approved novels, link to public page
            if (notification.type === "NOVEL_APPROVED") {
                return `/studio/novels`; // Go to studio novels to see approved
            }
            // For rejected/pending, link to preview page
            if (notification.type === "NOVEL_REJECTED" || notification.type === "NOVEL_PENDING") {
                return `/studio/novels/pending`; // Go to pending page
            }
            // NEW_NOVEL_SUBMISSION is handled dynamically in handleClick
        }

        // For comment replies - resourceId is the chapter URL
        if ((notification.resourceType === "COMMENT" || notification.resourceType === "comment") && notification.resourceId) {
            return notification.resourceId;
        }

        return "/";
    };

    return (
        <button
            onClick={handleClick}
            disabled={isNavigating}
            className={`block w-full text-left px-4 py-3 hover:bg-[#1E293B] transition-colors border-b border-[#34D399]/10 last:border-b-0 ${!notification.isRead ? "bg-[#1E293B]/50" : ""
                } ${isNavigating ? "opacity-50 cursor-wait" : ""}`}
        >
            <div className="flex gap-3">
                {/* Icon */}
                <div className="shrink-0 mt-1">
                    <div className={`p-2 rounded-full ${notification.type === "NOVEL_APPROVED"
                        ? "bg-green-500/20 text-green-500"
                        : notification.type === "NOVEL_REJECTED" || notification.type === "NOVEL_PERMANENTLY_DELETED"
                            ? "bg-red-500/20 text-red-500"
                            : notification.type === "NEW_CHAPTER"
                                ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                                : "bg-[#34D399]/20 text-[#34D399]"
                        }`}>
                        {isNavigating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Icon className="w-4 h-4" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm text-gray-200 line-clamp-2 wrap-break-word ${!notification.isRead ? "font-semibold" : "font-normal"
                        }`}>
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(notification.createdAt)}
                    </p>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                    <div className="shrink-0 mt-2">
                        <div className="w-2 h-2 bg-[#F59E0B] rounded-full"></div>
                    </div>
                )}
            </div>
        </button>
    );
}
