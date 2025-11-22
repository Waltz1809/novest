"use client";

import { unlockChapter } from "@/actions/wallet";
import { Lock, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

interface UnlockButtonProps {
    chapterId: number;
    price: number;
}

export default function UnlockButton({ chapterId, price }: UnlockButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleUnlock = () => {
        setError(null);
        startTransition(async () => {
            try {
                await unlockChapter(chapterId, price);
            } catch (e) {
                if (e instanceof Error) {
                    setError(e.message);
                } else {
                    setError("Có lỗi xảy ra");
                }
            }
        });
    };

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={handleUnlock}
                disabled={isPending}
                className="px-6 py-3 bg-indigo-600 text-white font-sans font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isPending ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                    </>
                ) : (
                    <>
                        <Lock className="w-5 h-5" />
                        Mở khóa ngay ({price} xu)
                    </>
                )}
            </button>
            {error && (
                <p className="mt-3 text-red-500 text-sm font-medium bg-red-50 px-3 py-1 rounded-md">
                    {error}
                </p>
            )}
        </div>
    );
}
