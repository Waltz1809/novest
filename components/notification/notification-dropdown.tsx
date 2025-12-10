"use client";

import { useEffect, useState } from "react";
import { getNotifications, markAllAsRead } from "@/actions/notification";
import { NotificationItem } from "./notification-item";
import { Bell, X } from "lucide-react";

interface NotificationModalProps {
    onClose: () => void;
    onUpdate: () => void;
}

export function NotificationModal({ onClose, onUpdate }: NotificationModalProps) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        setLoading(true);
        const result = await getNotifications(1, 15);
        // Filter out NEW_CHAPTER notifications (they go to library bell now)
        const filtered = result.notifications.filter(
            (n: any) => n.type !== "NEW_CHAPTER"
        );
        setNotifications(filtered);
        setLoading(false);
    }

    async function handleMarkAllRead() {
        await markAllAsRead();
        await loadNotifications();
        onUpdate();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-[#0B0C10] rounded-xl border border-[#34D399]/20 shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="px-4 py-3 border-b border-[#34D399]/20 flex items-center justify-between shrink-0">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[#F59E0B]" />
                        Thông báo
                    </h3>
                    <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-[#34D399] hover:text-[#F59E0B] transition-colors"
                            >
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto">
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
        </div>
    );
}
