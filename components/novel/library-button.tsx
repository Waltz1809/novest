"use client";

import { toggleLibrary } from "@/actions/library";
import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface LibraryButtonProps {
    novelId: number;
    initialIsInLibrary: boolean;
}

export default function LibraryButton({ novelId, initialIsInLibrary }: LibraryButtonProps) {
    const [isInLibrary, setIsInLibrary] = useState(initialIsInLibrary);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = () => {
        // Optimistic update
        setIsInLibrary((prev) => !prev);

        startTransition(async () => {
            try {
                await toggleLibrary(novelId);
                router.refresh();
            } catch (error) {
                // Revert on error
                setIsInLibrary((prev) => !prev);
                console.error("Failed to toggle library", error);
                alert("Có lỗi xảy ra, vui lòng thử lại.");
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isInLibrary
                    ? "bg-pink-100 text-pink-600 hover:bg-pink-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
        >
            <Heart className={`w-5 h-5 ${isInLibrary ? "fill-current" : ""}`} />
            {isInLibrary ? "Đã lưu" : "Yêu thích"}
        </button>
    );
}
