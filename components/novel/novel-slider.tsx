"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { VerticalCard } from "./vertical-card";
import "swiper/css";

interface NovelSliderProps {
  title: string;
  novels: any[];
  link?: string;
  slidesPerView?: number;
  controllerPosition?: "top" | "sides";
}

export function NovelSlider({
  title,
  novels,
  link,
  slidesPerView = 5,
  controllerPosition = "top",
}: NovelSliderProps) {
  const swiperRef = useRef<SwiperType>(null);

  if (novels.length === 0) return null;

  return (
    <>
      {/* Header */}
      {(title || link || controllerPosition === "top") && (
        <div className="mb-6 flex items-center justify-between px-4 md:px-0">
          <div className="flex items-end gap-4">
            <h2 className="text-2xl font-bold text-primary uppercase leading-none">
              {title}
            </h2>
            {link && (
              <Link
                href={link}
                className="text-sm font-medium text-gray-400 hover:text-primary transition-colors mb-0.5"
              >
                Xem tất cả
              </Link>
            )}
          </div>

          {/* Navigation Buttons (Top) */}
          {controllerPosition === "top" && (
            <div className="flex gap-2">
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                className="size-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary hover:text-white transition-all disabled:opacity-50 border"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                className="size-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary hover:text-white transition-all disabled:opacity-50 border"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Slider Container with Side Navigation */}
      <div className="relative group">
        {controllerPosition === "sides" && (
          <>
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 size-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-primary shadow-md hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 border border-gray-100 dark:border-gray-700"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 size-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-primary shadow-md hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 border border-gray-100 dark:border-gray-700"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Slider */}
        <Swiper
          modules={[Navigation]}
          onBeforeInit={(swiper) => {
            swiperRef.current = swiper;
          }}
          spaceBetween={20}
          slidesPerView={1.5}
          breakpoints={{
            480: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            1024: { slidesPerView: slidesPerView },
          }}
          className="w-full px-4 md:px-0"
        >
          {novels.map((novel) => (
            <SwiperSlide key={novel.id}>
              <VerticalCard
                novel={novel}
                className="w-full"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}
