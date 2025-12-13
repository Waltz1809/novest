"use client";

import { Library, BookOpen, ChevronRight, BookMarked, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { libraryService, LibraryUpdateItem } from "@/services";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LibraryNotificationBell() {
  const [updateCount, setUpdateCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  async function loadUpdateCount() {
    const count = await libraryService.getUpdateCount();
    setUpdateCount(count);
  }

  useEffect(() => {
    setMounted(true);
    const fetch = () => {
      loadUpdateCount();
    };
    fetch();
    const interval = setInterval(fetch, 60000); // Poll every minute
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
          aria-label="Tủ truyện cập nhật"
        >
          <BookMarked size={24} />
          {mounted && updateCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-amber-500 rounded-full min-w-[20px]">
              {updateCount > 99 ? "99+" : updateCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0"
        align="end"
      >
        <LibraryNotificationList
          onClose={() => setOpen(false)}
          onUpdateCount={loadUpdateCount}
        />
      </PopoverContent>
    </Popover>
  );
}

interface LibraryNotificationListProps {
  onClose: () => void;
  onUpdateCount: () => void;
}

function LibraryNotificationList({ onClose, onUpdateCount }: LibraryNotificationListProps) {
  const [novels, setNovels] = useState<LibraryUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());

  async function loadUpdates() {
    setLoading(true);
    const result = await libraryService.getUpdates({ limit: 5 });
    if (result.success && result.data) {
      setNovels(result.data.items as LibraryUpdateItem[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUpdates();
  }, []);

  async function handleMarkAsRead(novelId: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setMarkingIds(prev => new Set(prev).add(novelId));

    const result = await libraryService.markAsRead(novelId);
    if (result.success) {
      setNovels(prev => prev.filter(n => n.novelId !== novelId));
      onUpdateCount();
    }

    setMarkingIds(prev => {
      const next = new Set(prev);
      next.delete(novelId);
      return next;
    });
  }

  async function handleMarkAllAsRead() {
    setMarkingAll(true);

    const result = await libraryService.markAllAsRead();
    if (result.success) {
      setNovels([]);
      onUpdateCount();
    }

    setMarkingAll(false);
  }

  async function handleNovelClick(novelId: number) {
    // Auto-mark as read when clicking novel
    await libraryService.markAsRead(novelId);
    setNovels(prev => prev.filter(n => n.novelId !== novelId));
    onUpdateCount();
    onClose();
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="font-semibold flex items-center gap-2 text-foreground">
          Truyện cập nhật
        </h3>
        {novels.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="text-xs text-amber-500 hover:text-amber-600 transition-colors disabled:opacity-50"
          >
            {markingAll ? "Đang xử lý..." : "Đọc tất cả"}
          </button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Đang tải...
          </div>
        ) : novels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-3 px-4">
            <Library className="w-12 h-12 text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground text-sm">
              Không có truyện nào cập nhật
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {novels.map((novel) => (
              <div
                key={novel.novelId}
                className="flex gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors group relative"
              >
                {/* Novel card link */}
                <Link
                  href={`/truyen/${novel.slug}`}
                  onClick={() => handleNovelClick(novel.novelId)}
                  className="flex gap-3 flex-1 min-w-0"
                >
                  {/* Cover */}
                  <div className="w-12 h-16 relative shrink-0 rounded overflow-hidden bg-muted">
                    {novel.coverImage ? (
                      <Image
                        src={novel.coverImage}
                        alt={novel.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-amber-500 transition-colors">
                      {novel.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {novel.latestChapter.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-medium rounded">
                        +{novel.newChaptersCount} chương mới
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Mark as read button */}
                <button
                  onClick={(e) => handleMarkAsRead(novel.novelId, e)}
                  disabled={markingIds.has(novel.novelId)}
                  className="shrink-0 self-center p-2 hover:bg-muted-foreground/10 rounded-lg transition-colors text-muted-foreground hover:text-green-500 disabled:opacity-50"
                  aria-label="Đánh dấu đã đọc"
                  title="Đánh dấu đã đọc"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 shrink-0">
        <Button
          variant="default"
          className="w-full"
          asChild
        >
          <Link
            href="/tu-truyen"
            onClick={onClose}
          >
            Xem tủ truyện
            <ChevronRight size={22} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
