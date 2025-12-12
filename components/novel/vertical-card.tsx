"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Star, Layers, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { GenreLabel } from "./genre-label";

interface VerticalCardProps {
  novel: {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
    avgRating?: number;
    description?: string | null;
    viewCount?: number;
    chapterCount?: number;
    voteCount?: number;
    genre?: string;
  };
  className?: string;
}

export function VerticalCard({ novel, className }: VerticalCardProps) {
  return (
    <Link
      href={`/truyen/${novel.slug}`}
      className={cn("block w-[200px] shrink-0 group", className)}
    >
      <div className="novel-card rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer relative bg-white h-full flex flex-col transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        {/* 1. Ảnh Bìa (Tỉ lệ 2:3) */}
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-gray-100">
          <Image
            src={novel.coverImage || "/placeholder.jpg"}
            alt={novel.title}
            fill
            className="card-img w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 150px, 200px"
          />

          {/* Overlay mờ nhẹ khi hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
        </div>

        {/* 2. Nội dung */}
        <div className="p-4 pt-5 relative bg-white flex flex-col flex-1">
          {/* Floating Stats (Chỉ số nổi) */}
          <div className="absolute -top-5 right-3 bg-white shadow-lg rounded-full px-3 py-1 flex items-center gap-3 text-xs border border-gray-50 z-10">
            <span className="text-gray-600 font-bold flex items-center">
              <Eye className="w-3 h-3 text-blue-400 mr-1" />
              {novel.viewCount
                ? (novel.viewCount / 1000).toFixed(0) + "K"
                : "50K"}
            </span>
            <div className="w-px h-3 bg-gray-200"></div>
            <span className="text-gray-600 font-bold flex items-center">
              <Star className="w-3 h-3 text-yellow-400 mr-1 fill-current" />
              {novel.avgRating ? novel.avgRating.toFixed(1) : "4.8"}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-2 mt-1">
            <GenreLabel
              name="HOT"
              className="bg-primary text-white shadow-sm"
            />
            <GenreLabel name={novel.genre || "Đô Thị"} />
          </div>

          {/* Tên */}
          <h3 className="font-bold text-lg text-gray-800 mb-2 leading-tight group-hover:text-secondary transition-colors line-clamp-2 min-h-[1.5em]">
            {novel.title}
          </h3>

          {/* Mô tả */}
          <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8 leading-4">
            {novel.description ||
              "Một câu chuyện hấp dẫn đang chờ bạn khám phá."}
          </p>

          {/* Footer Meta */}
          <div className="mt-auto grid grid-cols-2 gap-2 text-xs border-t border-dashed border-gray-100 pt-3">
            <div className="text-gray-500 font-medium flex items-center">
              <Layers className="w-3 h-3 text-gray-300 mr-1.5" />
              {novel.chapterCount || 500}c
            </div>
            <div className="text-right font-bold text-primary flex items-center justify-end">
              <Heart className="w-3 h-3 mr-1" />
              {novel.voteCount || 900} Phiếu
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
