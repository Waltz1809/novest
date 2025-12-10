"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";
import { approveNovel, rejectNovel, permanentlyRejectNovel } from "@/actions/novel";

interface ApprovalControlsProps {
    novelId: number;
    novelTitle: string;
}

export function ApprovalControls({ novelId, novelTitle }: ApprovalControlsProps) {
    const router = useRouter();
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isPermanentRejectOpen, setIsPermanentRejectOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [permanentReason, setPermanentReason] = useState("");
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

    const handlePermanentReject = () => {
        if (permanentReason.length < 10) {
            setError("Lý do từ chối phải có ít nhất 10 ký tự");
            return;
        }

        if (!confirm(`⚠️ XÁC NHẬN XOÁ VĨNH VIỄN\n\nTruyện "${novelTitle}" sẽ bị xoá vĩnh viễn và KHÔNG THỂ khôi phục.\n\nBạn có chắc chắn?`)) {
            return;
        }

        startTransition(async () => {
            const result = await permanentlyRejectNovel(novelId, permanentReason);
            if (result.error) {
                setError(result.error);
            } else {
                alert("Đã từ chối và xoá vĩnh viễn truyện!");
                router.push("/studio/novels/pending");
            }
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-bold text-white">Quản lý duyệt truyện</h3>
                    <p className="text-sm text-[#9CA3AF]">
                        Truyện &quot;{novelTitle}&quot; đang chờ phê duyệt
                    </p>
                </div>
                <div className="flex gap-3 flex-wrap">
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
                        onClick={() => {
                            setIsRejectOpen(!isRejectOpen);
                            setIsPermanentRejectOpen(false);
                        }}
                        disabled={isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-all disabled:opacity-50"
                    >
                        <XCircle className="w-4 h-4" />
                        Từ chối
                    </button>
                    <button
                        onClick={() => {
                            setIsPermanentRejectOpen(!isPermanentRejectOpen);
                            setIsRejectOpen(false);
                        }}
                        disabled={isPending}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white font-bold rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        Từ chối & Xoá
                    </button>
                </div>
            </div>

            {/* Reject form (with 3-strike) */}
            {isRejectOpen && (
                <div className="bg-[#0B0C10] p-4 rounded-lg border border-amber-500/30 animate-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-white mb-2">
                        Lý do từ chối <span className="text-amber-400">*</span>
                    </label>
                    <p className="text-xs text-amber-400 mb-2">
                        💡 Người đăng có thể sửa và nộp lại. Sau 3 lần từ chối sẽ xoá vĩnh viễn.
                    </p>
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
                    <p className={`text-xs mt-1 ${reason.length >= 10 ? 'text-green-400' : 'text-amber-400'}`}>
                        {reason.length}/10 ký tự {reason.length >= 10 ? '✓' : '(tối thiểu 10)'}
                    </p>
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
                            className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Permanent reject form */}
            {isPermanentRejectOpen && (
                <div className="bg-[#0B0C10] p-4 rounded-lg border border-red-500/30 animate-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-white mb-2">
                        Lý do từ chối & xoá vĩnh viễn <span className="text-red-400">*</span>
                    </label>
                    <p className="text-xs text-red-400 mb-2">
                        ⚠️ CẢNH BÁO: Truyện sẽ bị XOÁ VĨNH VIỄN và KHÔNG THỂ khôi phục!
                    </p>
                    <textarea
                        value={permanentReason}
                        onChange={(e) => {
                            setPermanentReason(e.target.value);
                            setError("");
                        }}
                        placeholder="Nhập lý do từ chối (ít nhất 10 ký tự)..."
                        rows={3}
                        className="w-full px-4 py-3 bg-[#1E293B] border border-red-500/30 rounded-lg text-white placeholder:text-gray-600 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none"
                        disabled={isPending}
                    />
                    {error && (
                        <p className="text-red-400 text-sm mt-2">{error}</p>
                    )}
                    <p className={`text-xs mt-1 ${permanentReason.length >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                        {permanentReason.length}/10 ký tự {permanentReason.length >= 10 ? '✓' : '(tối thiểu 10)'}
                    </p>
                    <div className="flex justify-end gap-3 mt-3">
                        <button
                            onClick={() => {
                                setIsPermanentRejectOpen(false);
                                setPermanentReason("");
                                setError("");
                            }}
                            className="px-4 py-2 text-[#9CA3AF] hover:text-white transition-colors"
                            disabled={isPending}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handlePermanentReject}
                            disabled={isPending || permanentReason.length < 10}
                            className="flex items-center gap-2 px-5 py-2 bg-red-700 text-white font-bold rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            Xác nhận xoá vĩnh viễn
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

