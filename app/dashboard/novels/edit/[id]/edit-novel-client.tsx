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
        createdAt: Date;
        content: string;
        price: number;
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
    const [activeTab, setActiveTab] = useState<"info" | "chapters">("info");

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
            <div className="w-full px-4 py-2 space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-[#34D399]/20 mb-6">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`
                            py-3 px-4 font-bold text-sm transition-all relative
                            ${activeTab === "info"
                                ? "text-[#F59E0B]"
                                : "text-[#9CA3AF] hover:text-white"
                            }
                        `}
                    >
                        Thông tin
                        {activeTab === "info" && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F59E0B] glow-amber"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("chapters")}
                        className={`
                            py-3 px-4 font-bold text-sm transition-all relative
                            ${activeTab === "chapters"
                                ? "text-[#34D399]"
                                : "text-[#9CA3AF] hover:text-white"
                            }
                        `}
                    >
                        Danh sách tập & Chương
                        {activeTab === "chapters" && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#34D399] glow-jade"></span>
                        )}
                    </button>
                </div>

                {/* Content */}
                {activeTab === "info" ? (
                    <section className="animate-in fade-in slide-in-from-left-4 duration-300">
                        <NovelInfoEditor novel={novel} />
                    </section>
                ) : (
                    <section className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <VolumeAccordion
                            novelId={novel.id}
                            volumes={novel.volumes}
                            onRenameVolume={handleRenameVolume}
                            onCreateVolume={handleCreateNewVolume}
                        />
                    </section>
                )}
            </div>
        </div>
    );
}
