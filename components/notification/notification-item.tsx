"use client";

import { BookOpen, MessageSquare, CheckCircle, XCircle, Bell } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-time";
import { markAsRead } from "@/actions/notification";
import Link from "next/link";

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
    const handleClick = async () => {
        // Mark as read
        await markAsRead(notification.id);
        onUpdate(); // Update unread count
        onClose(); // Close dropdown
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

    // Construct link based on resource type and notification type
    const getLink = () => {
        // For novel-related notifications
        if (notification.resourceType === "NOVEL" && notification.resourceId) {
            const novelId = notification.resourceId;
            // For approved novels, link to public page
            if (notification.type === "NOVEL_APPROVED") {
                return `/studio/novels`; // Go to studio novels to see approved
            }
            // For rejected/pending, link to preview page
            if (notification.type === "NOVEL_REJECTED" || notification.type === "NOVEL_PENDING") {
                return `/studio/novels/pending`; // Go to pending page
            }
            // For new novel submission (admin notification), link to admin pending page
            if (notification.type === "NEW_NOVEL_SUBMISSION") {
                return `/admin/novels/pending`; // Admin reviews pending novels
            }
            // For new chapter notifications, the resourceId is the chapter URL
            if (notification.type === "NEW_CHAPTER") {
                return notification.resourceId;
            }
        }

        // For comment replies
        if (notification.resourceType === "COMMENT" && notification.resourceId) {
            return notification.resourceId; // Should be the chapter URL
        }

        return "/";
    };

    return (
        <Link
            href={getLink()}
            onClick={handleClick}
            className={`block px-4 py-3 hover:bg-[#1E293B] transition-colors border-b border-[#34D399]/10 last:border-b-0 ${!notification.isRead ? "bg-[#1E293B]/50" : ""
                }`}
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
                        <Icon className="w-4 h-4" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm text-gray-200 ${!notification.isRead ? "font-semibold" : "font-normal"
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
        </Link>
    );
}
