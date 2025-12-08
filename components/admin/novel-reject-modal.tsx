"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2, X } from "lucide-react";
import { rejectNovel } from "@/actions/novel";

interface NovelRejectModalProps {
    novelId: number;
    novelTitle: string;
}

export default function NovelRejectModal({ novelId, novelTitle }: NovelRejectModalProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleReject = () => {
        if (reason.length < 10) {
            setError("Lý do từ chối phải có ít nhất 10 ký tự");
            return;
        }

        startTransition(async () => {
            const result = await rejectNovel(novelId, reason);
            if (result.error) {
                setError(result.error);
            } else {
                setIsOpen(false);
                setReason("");
                router.refresh();
            }
        });
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                onClick={() => setIsOpen(true)}
            >
                <XCircle className="w-4 h-4 mr-2" />
                Từ chối
            </Button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => !isPending && setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-[#1E293B] rounded-xl border border-white/10 shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white">Từ chối truyện</h3>
                            <button
                                onClick={() => !isPending && setIsOpen(false)}
                                className="text-[#9CA3AF] hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            <p className="text-[#9CA3AF]">
                                Bạn đang từ chối truyện:{" "}
                                <span className="text-white font-medium">{novelTitle}</span>
                            </p>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">
                                    Lý do từ chối <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => {
                                        setReason(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="Nhập lý do từ chối (ít nhất 10 ký tự)..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-[#0B0C10] border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                                    disabled={isPending}
                                />
                                <p className="text-xs text-[#9CA3AF]">
                                    Người đăng sẽ nhận được thông báo với lý do này
                                </p>
                                <p className={`text-xs ${reason.length >= 10 ? 'text-green-400' : 'text-amber-400'}`}>
                                    {reason.length}/10 ký tự {reason.length >= 10 ? '✓' : '(tối thiểu 10)'}
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-4 border-t border-white/10">
                            <Button
                                variant="outline"
                                className="flex-1 border-white/10"
                                onClick={() => setIsOpen(false)}
                                disabled={isPending}
                            >
                                Hủy
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                                onClick={handleReject}
                                disabled={isPending || reason.length < 10}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Xác nhận từ chối
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
