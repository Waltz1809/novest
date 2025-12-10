"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { getUnreadCount } from "@/actions/notification";
import Link from "next/link";
import { NotificationDropdown } from "./notification-dropdown";

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Fetch unread count on mount
        loadUnreadCount();

        // Poll every 30 seconds for new notifications
        const interval = setInterval(loadUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []);

    async function loadUnreadCount() {
        const count = await getUnreadCount();
        setUnreadCount(count);
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
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
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="fixed sm:absolute right-4 sm:right-0 mt-2 z-50 left-4 sm:left-auto">
                        <NotificationDropdown
                            onClose={() => setIsOpen(false)}
                            onUpdate={loadUnreadCount}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
