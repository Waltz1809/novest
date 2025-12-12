"use client";

import { useEffect, useState } from "react";
import {
  notificationService,
  NotificationItem as NotificationItemType,
} from "@/services";
import { NotificationItem } from "./notification-item";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationListProps {
  onUpdate: () => void;
}

export function NotificationList({ onUpdate }: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationItemType[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    setLoading(true);
    try {
      const result = await notificationService.getAll({ page: 1, limit: 15 });
      if (result.success && result.data) {
        // Filter out NEW_CHAPTER notifications (they go to library bell now)
        const filtered = result.data.items.filter(
          (n) => n.type !== "NEW_CHAPTER"
        );
        setNotifications(filtered);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
      onUpdate();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="font-semibold flex items-center gap-2 text-foreground">
          Thông báo
        </h3>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="h-8 text-xs text-muted-foreground hover:text-primary"
          >
            <Check className="w-3 h-3 mr-1" />
            Đã đọc tất cả
          </Button>
        )}
      </div>

      {/* Notification List */}
      <ScrollArea className="h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Đang tải...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-3 px-4">
            <Bell className="w-12 h-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground text-sm">
              Không có thông báo mới
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={() => {}} // Popover handles closing on click outside usually, or we can pass a close handler if needed
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
