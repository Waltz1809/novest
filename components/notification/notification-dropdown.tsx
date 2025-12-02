"use client";

import { useEffect, useState } from "react";
import { getNotifications, markAllAsRead } from "@/actions/notification";
import { NotificationItem } from "./notification-item";
import { Bell } from "lucide-react";

interface NotificationDropdownProps {
    onClose: () => void;
    onUpdate: () => void;
}

export function NotificationDropdown({ onClose, onUpdate }: NotificationDropdownProps) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        setLoading(true);
        const result = await getNotifications(1, 10);
        setNotifications(result.notifications);
        setLoading(false);
    }

    async function handleMarkAllRead() {
        await markAllAsRead();
        await loadNotifications();
        onUpdate(); // Update unread count
    }

    return (
        <div className="w-96 bg-[#0B0C10] border border-[#34D399]/20 rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#34D399]/20 flex items-center justify-between">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#F59E0B]" />
                    Thông báo
                </h3>
                {notifications.length > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-[#34D399] hover:text-[#F59E0B] transition-colors"
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Notification List */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="px-4 py-8 text-center text-gray-400">
                        Đang tải...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <Bell className="w-12 h-12 mx-auto text-gray-600 mb-2" />
                        <p className="text-gray-400 text-sm">Không có thông báo mới</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClose={onClose}
                            onUpdate={onUpdate}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
