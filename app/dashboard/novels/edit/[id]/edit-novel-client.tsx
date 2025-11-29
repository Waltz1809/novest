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
        <div className="h-screen flex overflow-hidden">
            {/* Sidebar - 25% */}
            <aside className="w-1/4">
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
            <main className="flex-1">
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
