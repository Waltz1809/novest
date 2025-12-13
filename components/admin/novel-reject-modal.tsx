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
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
                    <div className="relative bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-foreground">Từ chối truyện</h3>
                            <button
                                onClick={() => !isPending && setIsOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            <p className="text-muted-foreground">
                                Bạn đang từ chối truyện:{" "}
                                <span className="text-foreground font-medium">{novelTitle}</span>
                            </p>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
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
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-foreground placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                                    disabled={isPending}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Người đăng sẽ nhận được thông báo với lý do này
                                </p>
                                <p className={`text-xs ${reason.length >= 10 ? 'text-green-600' : 'text-amber-600'}`}>
                                    {reason.length}/10 ký tự {reason.length >= 10 ? '✓' : '(tối thiểu 10)'}
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                className="flex-1 border-gray-200"
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
