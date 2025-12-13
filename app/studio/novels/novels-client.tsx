"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, ChevronDown, User, Users } from "lucide-react";
import NovelGridCard from "@/components/studio/novel-grid-card";
import ReindexButton from "@/components/novel/reindex-button";

interface Novel {
    id: number;
    title: string;
    slug: string;
    author: string;
    coverImage: string | null;
    status: "ONGOING" | "COMPLETED" | "HIATUS";
    approvalStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
    viewCount: number;
    volumes: {
        _count: {
            chapters: number;
        };
    }[];
}

interface NovelsPageProps {
    novels: Novel[];
    pageTitle?: string;
    isAdmin?: boolean;
    currentOwnerFilter?: string;
}

export default function NovelsPageClient({
    novels,
    pageTitle,
    isAdmin = false,
    currentOwnerFilter = "self"
}: NovelsPageProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredNovels, setFilteredNovels] = useState(novels);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Client-side search filtering
    useEffect(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) {
            setFilteredNovels(novels);
            return;
        }

        const filtered = novels.filter(
            (novel) =>
                novel.title.toLowerCase().includes(query) ||
                novel.author.toLowerCase().includes(query)
        );
        setFilteredNovels(filtered);
    }, [searchQuery, novels]);

    // Handle owner filter change
    const handleOwnerFilterChange = (value: string) => {
        setIsDropdownOpen(false);
        if (value === "self") {
            router.push("/studio/novels");
        } else {
            router.push(`/studio/novels?owner=${value}`);
        }
    };

    const ownerOptions = [
        { value: "self", label: "Truyện của tôi", icon: User },
        { value: "all", label: "Tất cả truyện", icon: Users },
    ];

    const currentOption = ownerOptions.find(o => o.value === currentOwnerFilter) || ownerOptions[0];

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Left side: Search + Owner Filter */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white text-foreground rounded-lg border border-gray-200 focus-within:border-primary transition-all flex-1 md:w-[300px]">
                        <Search className="w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Nhập tên truyện..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* Owner Filter Dropdown - Admin/Mod only */}
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-foreground rounded-lg border border-gray-200 hover:border-primary transition-all whitespace-nowrap"
                            >
                                <currentOption.icon className="w-4 h-4 text-primary" />
                                <span className="text-sm">{currentOption.label}</span>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsDropdownOpen(false)}
                                    />
                                    {/* Menu */}
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                        {ownerOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleOwnerFilterChange(option.value)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${currentOwnerFilter === option.value
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-foreground hover:bg-gray-100"
                                                    }`}
                                            >
                                                <option.icon className="w-4 h-4" />
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons (Right) */}
                <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                    {isAdmin && <ReindexButton />}
                    <Link
                        href="/studio/novels/create"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-all duration-300 text-sm md:text-base whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo Mới
                    </Link>
                </div>
            </div>

            {/* Grid Layout */}
            {filteredNovels.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {filteredNovels.map((novel) => {
                        const chapterCount = novel.volumes.reduce(
                            (acc, vol) => acc + vol._count.chapters,
                            0
                        );

                        return (
                            <NovelGridCard
                                key={novel.id}
                                id={novel.id}
                                title={novel.title}
                                slug={novel.slug}
                                coverImage={novel.coverImage}
                                status={novel.status as "ONGOING" | "COMPLETED" | "HIATUS"}
                                approvalStatus={novel.approvalStatus}
                                viewCount={novel.viewCount}
                                chapterCount={chapterCount}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Search className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        {searchQuery ? "No novels found" : "Chưa có truyện nào nè"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        {searchQuery
                            ? `No results for "${searchQuery}"`
                            : "Bắt đầu đăng tải siêu phẩm của bạn tại Novest thôi!"}
                    </p>
                    {!searchQuery && (
                        <Link
                            href="/studio/novels/create"
                            className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Tạo Truyện Mới
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
