import Link from "next/link";
import Image from "next/image";
import { Eye, Star, Zap, Clock, UserPen } from "lucide-react";
import { cn } from "@/lib/utils";
import { GenreLabel } from "@/components/novel/genre-label";

export interface HorizontalCardProps {
  novel: {
    id: number | string;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
    status?: string;
    createdAt?: Date | string;
    description?: string;
    categories?: { id: number; name: string }[] | string[];
    views?: number;
    rating?: number;
    latestChapter?: {
      title: string;
      number?: number;
      updatedAt?: Date | string;
    } | null;
  };
  variant?: "default" | "compact" | "text-only";
  rank?: number;
}

// Helper to format numbers (e.g. 1200 -> 1.2K)
function formatNumber(num?: number): string {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// Helper to format time (e.g. 10 minutes ago)
function formatTime(date?: Date | string): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000; // seconds

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return d.toLocaleDateString("vi-VN");
}

export function HorizontalCard({
  novel,
  variant = "default",
  rank,
}: HorizontalCardProps) {
  // Normalize categories to string array
  const categoryNames = Array.isArray(novel.categories)
    ? novel.categories.map((c) => (typeof c === "string" ? c : c.name))
    : [];

  if (variant === "compact" || variant === "text-only") {
    return (
      <Link
        href={`/truyen/${novel.slug}`}
        className="novel-card flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 shadow-sm cursor-pointer group bg-white dark:bg-gray-900/50 transition-all"
      >
        {variant === "compact" && (
          <div className="w-16 h-24 shrink-0 rounded-lg overflow-hidden relative bg-gray-100 dark:bg-gray-800">
            <Image
              src={novel.coverImage || "/images/default-cover.png"}
              alt={novel.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="64px"
            />
            {rank && (
              <div
                className={cn(
                  "absolute top-0 left-0 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-br-md",
                  rank === 1
                    ? "bg-yellow-400"
                    : rank === 2
                      ? "bg-gray-400"
                      : rank === 3
                        ? "bg-orange-400"
                        : "bg-blue-400"
                )}
              >
                {rank}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
            {rank && variant === "text-only" && (
              <span className="mr-2 text-primary">#{rank}</span>
            )}
            {novel.title}
          </h4>
          <div className="text-xs text-gray-400 mb-1 line-clamp-1">
            {categoryNames.slice(0, 2).join(" • ")}
          </div>
          <div className="flex items-center gap-3 text-xs">
            {novel.rating && (
              <span className="font-bold text-secondary flex items-center">
                <Star className="w-3 h-3 text-yellow-400 mr-1 fill-yellow-400" />
                {novel.rating.toFixed(1)}
              </span>
            )}
            {novel.views && (
              <span className="text-gray-400 flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {formatNumber(novel.views)}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Default Variant (Detailed)
  return (
    <div className="novel-card flex flex-row rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer group h-48 md:h-52 bg-white dark:bg-gray-900 transition-all hover:shadow-md">
      <Link
        href={`/truyen/${novel.slug}`}
        className="w-32 md:w-40 shrink-0 relative overflow-hidden bg-gray-100 dark:bg-gray-800"
      >
        <Image
          src={novel.coverImage || "/images/default-cover.png"}
          alt={novel.title}
          fill
          className="card-img object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 128px, 160px"
        />
        {novel.views && novel.views > 100000 && (
          <div className="absolute top-2 left-2">
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              HOT
            </span>
          </div>
        )}
      </Link>

      <div className="flex-1 p-4 flex flex-col relative">
        <div className="absolute top-4 right-4 hidden md:flex items-center gap-3 text-xs bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-100 dark:border-gray-700">
          {novel.views && (
            <span className="text-gray-500 dark:text-gray-400 font-bold flex items-center">
              <Eye className="w-3 h-3 text-blue-400 mr-1" />
              {formatNumber(novel.views)}
            </span>
          )}
          <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
          {novel.rating && (
            <span className="text-gray-500 dark:text-gray-400 font-bold flex items-center">
              <Star className="w-3 h-3 text-yellow-400 mr-1 fill-yellow-400" />
              {novel.rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mr-0 md:mr-24 mb-1">
          <Link href={`/truyen/${novel.slug}`}>
            <h3 className="font-bold text-lg md:text-xl text-gray-800 dark:text-gray-100 leading-tight group-hover:text-secondary transition-colors line-clamp-1">
              {novel.title}
            </h3>
          </Link>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {categoryNames.slice(0, 3).map((cat, idx) => (
              <GenreLabel
                key={idx}
                name={cat}
              />
            ))}
          </div>
        </div>

        {novel.latestChapter && (
          <div className="mt-2 text-sm font-semibold flex items-center justify-between text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5 line-clamp-1 hover:text-primary transition-colors cursor-pointer">
              <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {novel.latestChapter.title}
            </span>
            <span className="text-xs text-gray-400 whitespace-nowrap ml-2 flex-shrink-0 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(novel.latestChapter.updatedAt)}
            </span>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 mb-3 leading-relaxed hidden md:block">
          {novel.description || "Chưa có mô tả..."}
        </p>

        <div className="mt-auto flex items-center gap-3 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800">
          <div className="flex items-center text-xs text-gray-400">
            <UserPen className="w-3 h-3 mr-1.5" />
            {novel.author}
          </div>
          <Link
            href={`/truyen/${novel.slug}`}
            className="ml-auto"
          >
            <button className="text-xs font-bold px-3 py-1.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
              Đọc Tiếp
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
