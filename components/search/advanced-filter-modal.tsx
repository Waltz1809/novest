"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Genre {
    id: number;
    name: string;
    slug: string;
}

interface AdvancedFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    genres: Genre[];
}

export default function AdvancedFilterModal({
    isOpen,
    onClose,
    genres,
}: AdvancedFilterModalProps) {
    const router = useRouter();
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [status, setStatus] = useState<string>("all");

    if (!isOpen) return null;

    const handleGenreToggle = (slug: string) => {
        setSelectedGenres((prev) =>
            prev.includes(slug)
                ? prev.filter((s) => s !== slug)
                : [...prev, slug]
        );
    };

    const handleSearch = () => {
        const params = new URLSearchParams();

        // Add selected genres
        if (selectedGenres.length > 0) {
            params.set("genres", selectedGenres.join(","));
        }

        // Add status filter
        if (status !== "all") {
            params.set("status", status);
        }

        // Navigate to search page
        const url = `/tim-kiem${params.toString() ? `?${params.toString()}` : ""}`;
        router.push(url);
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <div className="relative w-full max-w-3xl mx-4 bg-[#0B0C10] border border-[#374151] text-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#374151]">
                    <h2 className="text-xl font-semibold text-white">
                        Tìm kiếm nâng cao
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#1F2937] rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                    {/* Status Filter */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-2">
                            Tình trạng
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2 bg-[#1F2937] border border-[#374151] rounded-lg text-white focus:ring-2 focus:ring-[#F59E0B] outline-none"
                        >
                            <option value="all">Tất cả</option>
                            <option value="ONGOING">Đang ra</option>
                            <option value="COMPLETED">Hoàn thành</option>
                        </select>
                    </div>

                    {/* Genres Filter */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-3">
                            Thể loại ({selectedGenres.length} đã chọn)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {genres.map((genre) => (
                                <label
                                    key={genre.id}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedGenres.includes(genre.slug)}
                                        onChange={() => handleGenreToggle(genre.slug)}
                                        className="w-4 h-4 text-[#F59E0B] bg-[#1F2937] border-[#374151] rounded focus:ring-[#F59E0B] focus:ring-offset-[#0B0C10] cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-300 group-hover:text-[#F59E0B] transition-colors">
                                        {genre.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#374151] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 text-sm font-medium text-[#0B0C10] bg-[#F59E0B] hover:bg-[#FBBF24] rounded-lg transition-colors"
                    >
                        Tìm kiếm
                    </button>
                </div>
            </div>
        </div>
    );
}
