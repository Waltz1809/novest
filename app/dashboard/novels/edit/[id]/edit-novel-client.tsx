"use client";

import { useState } from "react";
import ChapterStructureTree from "@/components/dashboard/chapter-structure-tree";
import NovelInfoEditor from "@/components/dashboard/novel-info-editor";
import ChapterEditorWrapper from "@/components/dashboard/chapter-editor";

interface Volume {
    id: number;
    title: string;
    order: number;
    chapters: {
        id: number;
        title: string;
        order: number;
    }[];
}

interface Genre {
    id: number;
    name: string;
    slug: string;
}

interface Novel {
    id: number;
    title: string;
    author: string;
    description: string | null;
    status: string;
    coverImage: string | null;
    genres: Genre[];
    volumes: Volume[];
}

interface EditNovelPageClientProps {
    novel: Novel;
}

export default function EditNovelPageClient({ novel }: EditNovelPageClientProps) {
    // "novel" = show info form, "new" = new chapter, number = show chapter editor for that chapter ID
    const [activeView, setActiveView] = useState<"novel" | "new" | number>("novel");
    const [selectedVolumeId, setSelectedVolumeId] = useState<number | null>(null);

    const handleCreateNewChapter = (volumeId: number) => {
        setSelectedVolumeId(volumeId);
        setActiveView("new");
    };

    const handleCreateNewVolume = async () => {
        // Create new volume via API
        try {
            const response = await fetch("/api/volumes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ novelId: novel.id }),
            });

            if (!response.ok) throw new Error("Failed to create volume");

            // Reload page to show new volume
            window.location.reload();
        } catch (error) {
            console.error("Failed to create volume:", error);
            alert("Lỗi khi tạo tập mới");
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden lg:overflow-visible">
            {/* Sidebar - 25% */}
            <aside className="w-full lg:w-1/4 border-b lg:border-b-0 lg:border-r border-[#34D399]/20 bg-[#1E293B] lg:bg-transparent">
                <ChapterStructureTree
                    novelTitle={novel.title}
                    volumes={novel.volumes}
                    activeView={activeView}
                    onSelectNovel={() => setActiveView("novel")}
                    onSelectChapter={(chapterId) => setActiveView(chapterId)}
                    onCreateNewChapter={handleCreateNewChapter}
                    onCreateNewVolume={handleCreateNewVolume}
                />
            </aside>

            {/* Main Workspace - 75% */}
            <main className="flex-1 w-full lg:w-3/4 overflow-y-auto h-[calc(100vh-200px)] lg:h-auto">
                {activeView === "novel" ? (
                    <NovelInfoEditor novel={novel} />
                ) : (
                    <ChapterEditorWrapper
                        chapterId={activeView === "new" ? "new" : activeView}
                        novelId={novel.id}
                        volumeId={selectedVolumeId || novel.volumes[0]?.id}
                        volumes={novel.volumes}
                    />
                )}
            </main>
        </div>
    );
}
