"use client";

import Link from "next/link";
import NovelInfoEditor from "@/components/studio/novel-info-editor";

interface Genre {
    id: number;
    name: string;
    slug: string;
}

interface Group {
    id: string;
    name: string;
}

interface Novel {
    id: number;
    title: string;
    slug: string;
    author: string;
    description: string | null;
    status: string;
    coverImage: string | null;
    alternativeTitles: string | null;
    genres: Genre[];
    translationGroupId?: string | null;
}

interface EditNovelPageProps {
    novel: Novel;
    groups: Group[];
    isOwner: boolean;
}

export default function EditNovelPageClient({ novel, groups, isOwner }: EditNovelPageProps) {
    return (
        <div className="min-h-screen pb-20">
            <div className="w-full px-4 py-2 space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-gray-200 mb-6">
                    <div className="py-3 px-4 font-bold text-sm transition-all relative text-primary">
                        Thông tin
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
                    </div>
                    <Link
                        href={`/studio/novels/edit/${novel.id}/chapters`}
                        className="py-3 px-4 font-bold text-sm transition-all relative text-muted-foreground hover:text-foreground"
                    >
                        Danh sách tập & Chương
                    </Link>
                </div>

                {/* Content - NovelInfoEditor has its own internal 2-column layout */}
                <section className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <NovelInfoEditor novel={novel} groups={groups} isOwner={isOwner} />
                </section>
            </div>
        </div>
    );
}
