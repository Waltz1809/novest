"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Ticket, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { unlockChapter } from "@/actions/wallet";
import { formatPrice } from "@/lib/pricing";

interface ChapterUnlockModalProps {
    chapterId: number;
    chapterTitle: string;
    price: number;
    userBalance: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChapterUnlockModal({
    chapterId,
    chapterTitle,
    price,
    userBalance,
    isOpen,
    onClose,
}: ChapterUnlockModalProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const canAfford = userBalance >= price;
    const balanceAfter = userBalance - price;

    const handleUnlock = () => {
        startTransition(async () => {
            const result = await unlockChapter(chapterId);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    router.refresh();
                }, 1500);
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => !isPending && !success && onClose()}
            />
            <div className="relative bg-[#1E293B] rounded-xl border border-white/10 shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95">
                {/* Success State */}
                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Mở khóa thành công!</h3>
                        <p className="text-[#9CA3AF]">Đang tải nội dung chương...</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-6 text-center border-b border-white/10">
                            <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-7 h-7 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Mở khóa chương</h3>
                            <p className="text-sm text-[#9CA3AF] line-clamp-2">{chapterTitle}</p>
                        </div>

                        {/* Price Info */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[#9CA3AF]">Giá chương</span>
                                <span className="text-lg font-bold text-amber-400 flex items-center gap-1.5">
                                    <Ticket className="w-5 h-5" />
                                    {formatPrice(price)}
                                </span>
                            </div>

                            <div className="h-px bg-white/10" />

                            <div className="flex items-center justify-between">
                                <span className="text-[#9CA3AF]">Số dư hiện tại</span>
                                <span className="font-medium text-white">
                                    {userBalance.toLocaleString()} vé
                                </span>
                            </div>

                            {canAfford && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[#9CA3AF]">Số dư sau</span>
                                    <span className="font-medium text-green-400">
                                        {balanceAfter.toLocaleString()} vé
                                    </span>
                                </div>
                            )}

                            {!canAfford && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                    <div>
                                        <p className="text-sm text-red-400 font-medium">
                                            Không đủ vé
                                        </p>
                                        <p className="text-xs text-red-400/70">
                                            Cần thêm {(price - userBalance).toLocaleString()} vé
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-white/10 flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isPending}
                                className="flex-1 px-4 py-2.5 bg-white/5 text-[#9CA3AF] rounded-lg hover:bg-white/10 transition-colors"
                            >
                                Hủy
                            </button>
                            {canAfford ? (
                                <button
                                    onClick={handleUnlock}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2.5 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            Mở khóa
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        // Navigate to wallet/purchase page
                                        onClose();
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Ticket className="w-4 h-4" />
                                    Nạp vé
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
