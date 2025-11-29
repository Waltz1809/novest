"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Chapter {
    id: number;
    title: string;
    order: number;
}

interface Volume {
    id: number;
    title: string;
    order: number;
    chapters: Chapter[];
}

interface ChapterStructureTreeProps {
    novelTitle: string;
    volumes: Volume[];
    activeView: "novel" | "new" | number; // "novel" for info form, "new" for new chapter, chapter ID for editor
    onSelectNovel: () => void;
    onSelectChapter: (chapterId: number) => void;
    onCreateNewChapter: (volumeId: number) => void;
    onCreateNewVolume: () => void;
}

export default function ChapterStructureTree({
    novelTitle,
    volumes,
    activeView,
    onSelectNovel,
    onSelectChapter,
    onCreateNewChapter,
    onCreateNewVolume,
}: ChapterStructureTreeProps) {
    const [collapsedVolumes, setCollapsedVolumes] = useState<Set<number>>(new Set());

    const toggleVolume = (volumeId: number) => {
        const newCollapsed = new Set(collapsedVolumes);
        if (newCollapsed.has(volumeId)) {
            newCollapsed.delete(volumeId);
        } else {
            newCollapsed.add(volumeId);
        }
        setCollapsedVolumes(newCollapsed);
    };

    return (
        <div className="h-full flex flex-col bg-[#0B0C10] border-r border-[#34D399]/20">
            {/* Header */}
            <div className="p-4 border-b border-[#34D399]/20">
                <h2 className="text-white font-bold text-sm">TRÌNH QUẢN LÝ TRUYỆN</h2>
            </div>

            {/* Structure Tree */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {/* Novel Title Node (Clickable) */}
                <button
                    onClick={onSelectNovel}
                    className={`
                        w-full text-left p-3 mb-2 rounded-lg relative
                        transition-all duration-200
                        ${activeView === "novel"
                            ? "text-white bg-[#1E293B]"
                            : "text-[#9CA3AF] hover:text-white hover:bg-[#1E293B]/50"
                        }
                    `}
                >
                    {/* Amber Glow Bar */}
                    {activeView === "novel" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B] glow-amber rounded-l-lg" />
                    )}
                    <div className="ml-2">
                        <div className="text-xs text-[#9CA3AF] mb-1">Truyện</div>
                        <div className="font-semibold line-clamp-2">{novelTitle}</div>
                    </div>
                </button>

                {/* Volumes & Chapters */}
                <div className="space-y-1">
                    {volumes.map((volume) => {
                        const isCollapsed = collapsedVolumes.has(volume.id);

                        return (
                            <div key={volume.id}>
                                {/* Volume Header */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => toggleVolume(volume.id)}
                                        className="flex-1 flex items-center gap-2 p-2 text-[#9CA3AF] hover:text-white transition-colors"
                                    >
                                        {isCollapsed ? (
                                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                        )}
                                        <span className="text-sm font-medium truncate">
                                            Tập {volume.order}: {volume.title}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => onCreateNewChapter(volume.id)}
                                        className="px-2 py-1 text-xs text-[#F59E0B] hover:text-[#FBBF24] transition-colors font-bold"
                                        title="Thêm chương"
                                    >
                                        +Thêm chương
                                    </button>
                                </div>

                                {/* Chapter List */}
                                {!isCollapsed && (
                                    <div className="ml-6 space-y-0.5">
                                        {volume.chapters.map((chapter) => {
                                            const isActive = activeView === chapter.id;

                                            return (
                                                <button
                                                    key={chapter.id}
                                                    onClick={() => onSelectChapter(chapter.id)}
                                                    className={`
                                                        w-full text-left p-2 rounded-lg relative
                                                        transition-all duration-200 text-sm
                                                        ${isActive
                                                            ? "text-white bg-[#1E293B]"
                                                            : "text-[#9CA3AF] hover:text-white hover:bg-[#1E293B]/50"
                                                        }
                                                    `}
                                                >
                                                    {/* Amber Glow Bar */}
                                                    {isActive && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B] glow-amber rounded-l-lg" />
                                                    )}
                                                    <div className="ml-2 truncate">
                                                        Chương {chapter.order}: {chapter.title}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* New Volume Button */}
            <div className="p-4 border-t border-[#34D399]/20">
                <button
                    onClick={onCreateNewVolume}
                    className="w-full px-4 py-3 bg-[#34D399] text-[#0B0C10] font-bold rounded-lg hover:bg-[#6EE7B7] transition-colors"
                >
                    + Thêm tập
                </button>
            </div>
        </div>
    );
}
