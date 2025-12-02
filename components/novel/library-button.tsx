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
            className={className}
            title={isInLibrary ? "Đã lưu" : "Yêu thích"}
        >
            <Heart className={`w-5 h-5 ${isInLibrary ? "fill-current text-pink-500" : ""}`} />
            <span className="hidden md:inline">{isInLibrary ? "Đã lưu" : "Yêu thích"}</span>
        </button>
    );
}
