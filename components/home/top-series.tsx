"use client";

import Image from "next/image";
import Link from "next/link";
import Tilt from "react-parallax-tilt";
import { GenreLabel } from "../novel/genre-label";

interface TopSeriesProps {
  novels: any[];
}

export function TopSeries({ novels }: TopSeriesProps) {
  if (!novels || novels.length === 0) return null;

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-primary uppercase leading-none mb-6">
        Top Series
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8">
        {novels.slice(0, 8).map((novel, index) => (
          <Link
            key={novel.id}
            href={`/truyen/${novel.slug}`}
            className="group cursor-pointer relative block"
          >
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              scale={1.0}
              transitionSpeed={400}
              className="relative rounded-xl overflow-hidden aspect-[2/3] shadow-lg group-hover:shadow-2xl border border-gray-100/10"
            >
              <Image
                src={novel.coverImage || "/images/default-cover.png"}
                alt={novel.title}
                fill
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 150px, 200px"
              />
              {/* Gradient đen mờ ở đáy để làm nền cho số */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              {/* Số hạng */}
              <span className="rank-number text-[6rem] md:text-[8rem] lg:text-[10rem]">
                {index + 1}
              </span>
            </Tilt>
            <div className="mt-4 text-center md:text-left pl-2">
              <h3 className="font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1 text-base md:text-lg">
                {novel.title}
              </h3>
              <div className="mt-2">
                <GenreLabel name={novel.genres?.[0]?.name || "Truyện Hot"} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
