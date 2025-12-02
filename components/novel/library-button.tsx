"use client";

import { toggleLibrary } from "@/actions/library";
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
                await toggleLibrary(novelId);
                router.refresh();
                // Optional: Show success message if needed, but the button state change is usually enough.
                // Since user asked for "notification", we can add a small alert or just rely on the UI change.
                // For now, let's just log success.
                console.log(newState ? "Added to library" : "Removed from library");
            } catch (error: any) {
                // Revert on error
                setIsInLibrary((prev) => !prev);
                console.error("Failed to toggle library", error);

                // Show specific error message
                const message = error.message || "Có lỗi xảy ra, vui lòng thử lại.";
                alert(message);
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
                } ${className || ""}`}
        >
            <Heart className={`w-5 h-5 ${isInLibrary ? "fill-current" : ""}`} />
            {isInLibrary ? "Đã lưu" : "Yêu thích"}
        </button>
    );
}
