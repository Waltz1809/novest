"use client";

import { useState } from "react";
import NovelInfoEditor from "@/components/dashboard/novel-info-editor";
import VolumeAccordion from "@/components/dashboard/volume-accordion";

interface Volume {
    id: number;
    title: string;
    order: number;
    chapters: {
        id: number;
        title: string;
        order: number;
        updatedAt: Date;
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

interface EditNovelPageProps {
    novel: Novel;
}

export default function EditNovelPageClient({ novel }: EditNovelPageProps) {
    const handleCreateNewVolume = async () => {
        const title = window.prompt("Nhập tên tập mới:", `Tập ${novel.volumes.length + 1}`);
        if (!title) return;

        try {
            const response = await fetch("/api/volumes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    novelId: novel.id,
                    title: title
                }),
            });

            if (!response.ok) throw new Error("Failed to create volume");
            window.location.reload();
        } catch (error) {
            console.error("Failed to create volume:", error);
            alert("Lỗi khi tạo tập mới");
        }
    };

    const handleRenameVolume = async (volumeId: number, newTitle: string) => {
        try {
            const response = await fetch(`/api/volumes/${volumeId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle }),
            });

            if (!response.ok) throw new Error("Failed to rename volume");
            window.location.reload();
        } catch (error) {
            console.error("Failed to rename volume:", error);
            alert("Lỗi khi đổi tên tập");
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0C10] pb-20">
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                {/* 1. Novel Info Section */}
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#F59E0B] rounded-full glow-amber"></span>
                        Thông tin truyện
                    </h2>
                    <NovelInfoEditor novel={novel} />
                </section>

                {/* 2. Volumes & Chapters Section */}
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-[#34D399] rounded-full glow-jade"></span>
                        Danh sách tập & Chương
                    </h2>
                    <VolumeAccordion
                        novelId={novel.id}
                        volumes={novel.volumes}
                        onRenameVolume={handleRenameVolume}
                        onCreateVolume={handleCreateNewVolume}
                    />
                </section>
            </div>
        </div>
    );
}
