"use client";

import { BookOpen, MessageSquare } from "lucide-react";
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
    const Icon = notification.type === "NEW_CHAPTER" ? BookOpen : MessageSquare;

    // Construct link based on resource type
    const getLink = () => {
        if (notification.type === "NEW_CHAPTER") {
            return notification.resourceId;
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
                    <div className={`p-2 rounded-full ${notification.type === "NEW_CHAPTER"
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
