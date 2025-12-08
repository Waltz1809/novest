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
                    <div key={volume.id} className="border border-[#34D399]/10 rounded-xl overflow-hidden bg-[#1E293B]/30">
                        <button
                            onClick={() => toggleVolume(volume.id)}
                            className="w-full flex items-center justify-between p-4 bg-[#1E293B]/50 hover:bg-[#1E293B] transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-1 h-5 bg-[#F59E0B] rounded-full group-hover:h-6 transition-all"></span>
                                <h3 className="font-bold text-lg text-gray-200 group-hover:text-[#F59E0B] transition-colors">
                                    {volume.title}
                                </h3>
                                <span className="text-xs text-gray-500 bg-[#0B0C10] px-2 py-0.5 rounded-full border border-white/5">
                                    {volume.chapters.length} chương
                                </span>
                            </div>
                            {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#F59E0B] transition-colors" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#F59E0B] transition-colors" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 p-4 border-t border-[#34D399]/10 animate-in slide-in-from-top-2 duration-200">
                                {volume.chapters.map((chapter) => (
                                    <Link
                                        key={chapter.id}
                                        href={`/truyen/${novelSlug}/${chapter.slug}`}
                                        className="group/chapter flex items-center gap-2 py-2.5 border-b border-dashed border-[#34D399]/10 hover:bg-[#34D399]/5 px-2 rounded transition-colors"
                                        title={chapter.title}
                                    >
                                        <span className="text-sm text-gray-300 group-hover/chapter:text-[#F59E0B] transition-colors truncate">
                                            {chapter.title}
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
