"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { notificationService } from "@/services";
import { NotificationModal } from "./notification-dropdown";

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadUnreadCount();
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    async function loadUnreadCount() {
        try {
            const result = await notificationService.getAll({ limit: 1, unreadOnly: true });
            if (result.success && result.data) {
                setUnreadCount(result.data.total);
            }
        } catch (error) {
            console.error("Failed to load unread count:", error);
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 hover:bg-[#1E293B] rounded-lg transition-colors"
                aria-label="Thông báo"
            >
                <Bell className="w-5 h-5 text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px]">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <NotificationModal
                    onClose={() => setIsOpen(false)}
                    onUpdate={loadUnreadCount}
                />
            )}
        </>
    );
}
