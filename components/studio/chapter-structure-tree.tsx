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
    onRenameVolume: (volumeId: number, newTitle: string) => void;
}

export default function ChapterStructureTree({
    novelTitle,
    volumes,
    activeView,
    onSelectNovel,
    onSelectChapter,
    onCreateNewChapter,
    onCreateNewVolume,
    onRenameVolume,
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
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-foreground font-bold text-sm">TRÌNH QUẢN LÝ TRUYỆN</h2>
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
                            ? "text-foreground bg-gray-100"
                            : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                        }
                    `}
                >
                    {/* Primary Glow Bar */}
                    {activeView === "novel" && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
                    )}
                    <div className="ml-2">
                        <div className="text-xs text-muted-foreground mb-1">Truyện</div>
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
                                <div className="flex items-center gap-1 group/volume">
                                    <button
                                        onClick={() => toggleVolume(volume.id)}
                                        className="flex-1 flex items-center gap-2 p-2 text-muted-foreground hover:text-foreground transition-colors overflow-hidden"
                                    >
                                        {isCollapsed ? (
                                            <ChevronRight className="w-4 h-4 shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 shrink-0" />
                                        )}
                                        <span className="text-sm font-medium truncate">
                                            {volume.title}
                                        </span>
                                    </button>

                                    {/* Rename Volume Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newTitle = window.prompt("Đổi tên tập:", volume.title);
                                            if (newTitle && newTitle !== volume.title) {
                                                onRenameVolume(volume.id, newTitle);
                                            }
                                        }}
                                        className="p-1 text-muted-foreground hover:text-primary opacity-0 group-hover/volume:opacity-100 transition-opacity"
                                        title="Đổi tên tập"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                    </button>

                                    <button
                                        onClick={() => onCreateNewChapter(volume.id)}
                                        className="px-2 py-1 text-xs text-primary hover:text-primary/80 transition-colors font-bold shrink-0"
                                        title="Thêm chương"
                                    >
                                        +
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
                                                            ? "text-foreground bg-gray-100"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                                                        }
                                                    `}
                                                >
                                                    {/* Primary Glow Bar */}
                                                    {isActive && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
                                                    )}
                                                    <div className="ml-2 truncate">
                                                        {chapter.title}
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
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={onCreateNewVolume}
                    className="w-full px-4 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                    + Thêm tập
                </button>
            </div>
        </div>
    );
}
