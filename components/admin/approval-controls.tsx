"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { approveNovel, rejectNovel } from "@/actions/novel";

interface ApprovalControlsProps {
    novelId: number;
    novelTitle: string;
}

export function ApprovalControls({ novelId, novelTitle }: ApprovalControlsProps) {
    const router = useRouter();
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleApprove = () => {
        startTransition(async () => {
            const result = await approveNovel(novelId);
            if (result.error) {
                alert(result.error);
            } else {
                alert("Đã duyệt truyện thành công!");
                router.refresh();
            }
        });
    };

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
                setIsRejectOpen(false);
                setReason("");
                alert("Đã từ chối truyện!");
                router.refresh();
            }
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Quản lý duyệt truyện</h3>
                    <p className="text-sm text-[#9CA3AF]">
                        Truyện &quot;{novelTitle}&quot; đang chờ phê duyệt
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleApprove}
                        disabled={isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition-all disabled:opacity-50"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        Duyệt truyện
                    </button>
                    <button
                        onClick={() => setIsRejectOpen(!isRejectOpen)}
                        disabled={isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-all disabled:opacity-50"
                    >
                        <XCircle className="w-4 h-4" />
                        Từ chối
                    </button>
                </div>
            </div>

            {/* Reject form */}
            {isRejectOpen && (
                <div className="bg-[#0B0C10] p-4 rounded-lg border border-red-500/30 animate-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-white mb-2">
                        Lý do từ chối <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            setError("");
                        }}
                        placeholder="Nhập lý do từ chối (ít nhất 10 ký tự)..."
                        rows={3}
                        className="w-full px-4 py-3 bg-[#1E293B] border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                        disabled={isPending}
                    />
                    {error && (
                        <p className="text-red-400 text-sm mt-2">{error}</p>
                    )}
                    <div className="flex justify-end gap-3 mt-3">
                        <button
                            onClick={() => {
                                setIsRejectOpen(false);
                                setReason("");
                                setError("");
                            }}
                            className="px-4 py-2 text-[#9CA3AF] hover:text-white transition-colors"
                            disabled={isPending}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={isPending || reason.length < 10}
                            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <XCircle className="w-4 h-4" />
                            )}
                            Xác nhận từ chối
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
