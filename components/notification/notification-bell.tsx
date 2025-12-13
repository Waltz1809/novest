"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { notificationService } from "@/services";
import { NotificationList } from "./notification-dropdown";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  async function loadUnreadCount() {
    try {
      const result = await notificationService.getAll({
        limit: 1,
        unreadOnly: true,
      });
      if (result.success && result.data) {
        setUnreadCount(result.data.total);
      }
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  }

  useEffect(() => {
    setMounted(true);
    const fetch = () => {
      loadUnreadCount();
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Thông báo"
        >
          <Bell size={24} />
          {mounted && unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0"
        align="end"
      >
        <NotificationList onUpdate={loadUnreadCount} />
      </PopoverContent>
    </Popover>
  );
}
