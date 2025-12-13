"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Chapter {
    id: number;
    title: string;
    order: number;
    slug: string;
    createdAt: Date;
}

interface Volume {
    id: number;
    title: string;
    chapters: Chapter[];
}

interface VolumeListProps {
    volumes: Volume[];
    novelSlug: string;
}

export default function VolumeList({ volumes, novelSlug }: VolumeListProps) {
    // Initialize all volumes as expanded by default
    const [expandedVolumes, setExpandedVolumes] = useState<number[]>(
        volumes.map((v) => v.id)
    );

    const toggleVolume = (volumeId: number) => {
        setExpandedVolumes((prev) =>
            prev.includes(volumeId)
                ? prev.filter((id) => id !== volumeId)
                : [...prev, volumeId]
        );
    };

    return (
        <div className="space-y-6">
            {volumes.map((volume) => {
                const isExpanded = expandedVolumes.includes(volume.id);
                return (
                    <div key={volume.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <button
                            onClick={() => toggleVolume(volume.id)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-1 h-5 bg-amber-500 rounded-full group-hover:h-6 transition-all"></span>
                                <h3 className="font-bold text-lg text-foreground group-hover:text-amber-600 transition-colors">
                                    {volume.title}
                                </h3>
                                <span className="text-xs text-muted-foreground bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                    {volume.chapters.length} chương
                                </span>
                            </div>
                            {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 p-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
                                {volume.chapters.map((chapter) => (
                                    <Link
                                        key={chapter.id}
                                        href={`/truyen/${novelSlug}/${chapter.slug}`}
                                        className="group/chapter flex items-center justify-between gap-2 py-2.5 border-b border-dashed border-gray-200 hover:bg-amber-50 px-2 rounded transition-colors"
                                        title={chapter.title}
                                    >
                                        <span className="text-sm text-foreground group-hover/chapter:text-amber-600 transition-colors truncate">
                                            {chapter.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {new Date(chapter.createdAt).toLocaleDateString("vi-VN")}
                                        </span>
                                    </Link>
                                ))}
                                {volume.chapters.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic col-span-full py-2 text-center">
                                        Chưa có chương nào.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
