"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Lock,
    Unlock,
    Loader2,
    AlertCircle,
    CheckCircle,
    Ticket,
    Info,
} from "lucide-react";
import { setChapterPremium, removeChapterPremium } from "@/actions/pricing";
import { formatPrice, getSuggestedPriceRange } from "@/lib/pricing";

interface ChapterPremiumControlsProps {
    chapterId: number;
    isLocked: boolean;
    price: number;
    wordCount: number;
    novelWordCount: number;
    novelFormat: string;
    canBePremium: boolean;
    isLicensedDrop?: boolean;
}

export default function ChapterPremiumControls({
    chapterId,
    isLocked,
    price,
    wordCount,
    novelWordCount,
    novelFormat,
    canBePremium,
    isLicensedDrop = false,
}: ChapterPremiumControlsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showSettings, setShowSettings] = useState(false);
    const [newPrice, setNewPrice] = useState(price);
    const [error, setError] = useState("");

    const suggestedRange = getSuggestedPriceRange(wordCount, novelFormat as "WN" | "LN");
    const formatMultiplier = novelFormat === "LN" ? 1.2 : 1.0;

    const handleLock = () => {
        startTransition(async () => {
            const result = await setChapterPremium(chapterId, newPrice);
            if (result.error) {
                setError(result.error);
            } else {
                setShowSettings(false);
                router.refresh();
            }
        });
    };

    const handleUnlock = () => {
        startTransition(async () => {
            const result = await removeChapterPremium(chapterId);
            if (result.error) {
                setError(result.error);
            } else {
                router.refresh();
            }
        });
    };

    // Licensed drop novels cannot have premium chapters
    if (isLicensedDrop) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <div className="text-sm">
                    <span className="text-red-400">Không thể đặt VIP</span>
                    <p className="text-xs text-red-400/70 mt-0.5">
                        Truyện bản quyền đã drop không hỗ trợ chương trả phí
                    </p>
                </div>
            </div>
        );
    }

    // Not eligible for premium
    if (!canBePremium) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <Info className="w-4 h-4 text-muted-foreground" />
                <div className="text-sm">
                    <span className="text-muted-foreground">Chương miễn phí</span>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                        Truyện cần 50.000+ từ để có chương trả phí
                    </p>
                </div>
            </div>
        );
    }


    // Locked state
    if (isLocked) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 rounded-lg">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400 font-medium">
                        {formatPrice(price)}
                    </span>
                </div>
                <button
                    onClick={handleUnlock}
                    disabled={isPending}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-muted-foreground hover:text-foreground text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Unlock className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Mở khóa</span>
                </button>
            </div>
        );
    }

    // Unlocked state - show lock controls
    return (
        <>
            <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-muted-foreground hover:text-foreground text-sm rounded-lg transition-colors"
            >
                <Lock className="w-4 h-4" />
                <span>Đặt trả phí</span>
            </button>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => !isPending && setShowSettings(false)}
                    />
                    <div className="relative bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-amber-500" />
                            Đặt chương trả phí
                        </h3>

                        <div className="space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Số từ chương</p>
                                    <p className="text-lg font-bold text-foreground">
                                        {wordCount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Định dạng</p>
                                    <p className="text-lg font-bold text-foreground">
                                        {novelFormat} (x{formatMultiplier})
                                    </p>
                                </div>
                            </div>

                            {/* Price Input */}
                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">
                                    Giá (vé)
                                </label>
                                <div className="relative">
                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                                    <input
                                        type="number"
                                        value={newPrice}
                                        onChange={(e) => {
                                            setNewPrice(parseInt(e.target.value) || 0);
                                            setError("");
                                        }}
                                        min={suggestedRange.min}
                                        max={suggestedRange.max}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-foreground text-lg font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Đề xuất: {suggestedRange.min} - {suggestedRange.suggested} vé
                                    <span className="text-muted-foreground/50"> (tối đa {suggestedRange.max})</span>
                                </p>
                            </div>

                            {/* Preview */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                                <span className="text-sm text-amber-600">Giá hiển thị:</span>
                                <span className="font-bold text-amber-600">
                                    {formatPrice(newPrice)}
                                </span>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-muted-foreground rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleLock}
                                    disabled={isPending || newPrice <= 0}
                                    className="flex-1 px-4 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Xác nhận
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
