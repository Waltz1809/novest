"use client";

import { libraryService } from "@/services";
import { Heart } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface LibraryButtonProps {
    novelId: number;
    initialIsInLibrary: boolean;
    className?: string;
}

export default function LibraryButton({ novelId, initialIsInLibrary, className }: LibraryButtonProps) {
    const [isInLibrary, setIsInLibrary] = useState(initialIsInLibrary);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = () => {
        // Optimistic update
        const newState = !isInLibrary;
        setIsInLibrary(newState);

        startTransition(async () => {
            try {
                if (newState) {
                    await libraryService.follow(novelId);
                } else {
                    await libraryService.unfollow(novelId);
                }
                router.refresh();
                console.log(newState ? "Added to library" : "Removed from library");
            } catch (error: unknown) {
                // Revert on error
                setIsInLibrary((prev) => !prev);
                console.error("Failed to toggle library", error);

                // Show specific error message
                const message = error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.";
                alert(message);
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={className}
            title={isInLibrary ? "Đã lưu" : "Yêu thích"}
        >
            <Heart className={`w-5 h-5 ${isInLibrary ? "fill-current text-pink-500" : ""}`} />
            <span className="hidden md:inline">{isInLibrary ? "Đã lưu" : "Yêu thích"}</span>
        </button>
    );
}
