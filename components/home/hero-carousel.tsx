"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import { Crown, Heart } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

interface Novel {
  id: number;
  title: string;
  slug: string;
  author: string;
  description: string | null;
  coverImage: string | null;
}

interface HeroCarouselProps {
  novels: Novel[];
}

export function HeroCarousel({ novels }: HeroCarouselProps) {
  if (novels.length === 0) {
    return null;
  }

  return (
    <div className="container relative group my-10">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        loop={true}
        className="w-full h-auto md:h-[630px] rounded-xl overflow-hidden shadow-2xl [&_.swiper-pagination]:!bottom-5 [&_.swiper-pagination-bullet]:w-4 [&_.swiper-pagination-bullet]:h-1.5 [&_.swiper-pagination-bullet]:rounded-sm [&_.swiper-pagination-bullet]:bg-white/50 [&_.swiper-pagination-bullet]:opacity-70 [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:duration-300 [&_.swiper-pagination-bullet-active]:!w-10 [&_.swiper-pagination-bullet-active]:!bg-primary [&_.swiper-pagination-bullet-active]:!opacity-100"
      >
        {novels.map((novel, index) => (
          <SwiperSlide
            key={novel.id}
            className="relative bg-white overflow-hidden !h-auto"
          >
            {/* Background mờ */}
            <div className="absolute inset-0">
              {novel.coverImage ? (
                <Image
                  src={novel.coverImage}
                  alt=""
                  fill
                  className="object-cover blur-sm opacity-30"
                />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-background dark:via-background/90" />

            <div className="relative z-10 h-full flex flex-col md:flex-row items-center p-6 md:p-12 gap-8 justify-center pb-12 ">
              {/* Ảnh bìa truyện */}
              <div className="w-40 md:w-56 shrink-0 shadow-2xl rounded-lg overflow-hidden transform -rotate-3 border-4 border-white dark:border-gray-800 aspect-[2/3] relative">
                {novel.coverImage ? (
                  <Image
                    src={novel.coverImage}
                    alt={novel.title}
                    fill
                    sizes="(max-width: 768px) 160px, 224px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
              </div>

              {/* Thông tin */}
              <div className="flex-1 text-center md:text-left max-w-lg">
                {index === 0 && (
                  <span className="inline-flex items-center gap-2 px-3 py-2 mb-5 text-sm font-bold uppercase text-white rounded-sm shadow-sm bg-gradient-to-r from-yellow-600 via-yellow-300 to-yellow-600 bg-[length:200%_auto] animate-shimmer border border-yellow-400/50">
                    <Crown size={24} /> TOP 1 ĐỀ CỬ Tháng
                  </span>
                )}
                <h2 className="text-3xl md:text-5xl font-extrabold mb-3 text-foreground leading-normal">
                  {novel.title}
                </h2>
                <p className="text-muted-foreground mb-6 line-clamp-2 md:line-clamp-3 text-lg">
                  {novel.description || "Chưa có mô tả..."}
                </p>
                <div className="flex gap-4 justify-center md:justify-start">
                  <Link href={`/truyen/${novel.slug}`}>
                    <button className="px-8 py-3 rounded-full font-bold text-primary-foreground bg-primary shadow-lg transform transition hover:scale-105">
                      Đọc Ngay
                    </button>
                  </Link>
                  <button className="w-12 h-12 rounded-full border-2 border-primary text-primary flex items-center justify-center transition hover:bg-primary/10">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}

        {/* Slide 2: Banner Sự Kiện (Demo) */}
        <SwiperSlide className="relative overflow-hidden flex items-center justify-center bg-black !h-auto">
          <div className="relative w-full h-full">
            <Image
              src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop"
              alt="Event Banner"
              fill
              className="object-cover"
            />
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
