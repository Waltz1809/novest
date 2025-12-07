"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle, XCircle, Trash2, RotateCcw, Eye, Loader2 } from "lucide-react";
import { approveNovel, rejectNovel } from "@/actions/novel";
import { deleteNovel } from "@/actions/admin";
import Link from "next/link";

interface NovelActionsDropdownProps {
    novelId: number;
    novelSlug: string;
    novelTitle: string;
    approvalStatus: string;
}

export function NovelActionsDropdown({
    novelId,
    novelSlug,
    novelTitle,
    approvalStatus
}: NovelActionsDropdownProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [error, setError] = useState("");

    const handleApprove = () => {
        if (!confirm(`Duyệt truyện "${novelTitle}"?`)) return;

        startTransition(async () => {
            const result = await approveNovel(novelId);
            if (result.error) {
                alert(result.error);
            } else {
                alert("Đã duyệt truyện!");
                router.refresh();
            }
        });
    };

    const handleReject = () => {
        if (rejectReason.length < 10) {
            setError("Lý do phải có ít nhất 10 ký tự");
            return;
        }

        startTransition(async () => {
            const result = await rejectNovel(novelId, rejectReason);
            if (result.error) {
                setError(result.error);
            } else {
                alert(result.success);
                setIsRejectOpen(false);
                setRejectReason("");
                router.refresh();
            }
        });
    };

    const handleDelete = () => {
        if (!confirm(`Xóa mềm truyện "${novelTitle}"? Truyện sẽ chuyển sang trạng thái từ chối.`)) return;

        startTransition(async () => {
            try {
                await deleteNovel(novelId);
                alert("Đã xóa truyện!");
                router.refresh();
            } catch (error) {
                alert("Lỗi khi xóa truyện");
            }
        });
    };

    const handleRestore = () => {
        if (!confirm(`Khôi phục truyện "${novelTitle}" về trạng thái chờ duyệt?`)) return;

        startTransition(async () => {
            // Restore = approve but set to PENDING first via re-approve
            const result = await approveNovel(novelId);
            if (result.error) {
                alert(result.error);
            } else {
                alert("Đã khôi phục truyện về trạng thái đã duyệt!");
                router.refresh();
            }
        });
    };

    // Reject modal
    if (isRejectOpen) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsRejectOpen(false)}>
                <div className="bg-[#1E293B] rounded-xl p-6 max-w-md w-full mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-white mb-2">Từ chối truyện</h3>
                    <p className="text-sm text-gray-400 mb-4">"{novelTitle}"</p>

                    <textarea
                        value={rejectReason}
                        onChange={(e) => {
                            setRejectReason(e.target.value);
                            setError("");
                        }}
                        placeholder="Nhập lý do từ chối (ít nhất 10 ký tự)..."
                        rows={3}
                        className="w-full px-4 py-3 bg-[#0B0C10] border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:border-amber-500 outline-none resize-none"
                        disabled={isPending}
                    />

                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsRejectOpen(false);
                                setRejectReason("");
                                setError("");
                            }}
                            disabled={isPending}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={isPending || rejectReason.length < 10}
                            className="bg-red-600 hover:bg-red-500 text-white"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Từ chối
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1E293B] border-white/10">
                {/* View Button */}
                <DropdownMenuItem asChild>
                    <Link
                        href={approvalStatus === "APPROVED" ? `/truyen/${novelSlug}` : `/truyen/${novelSlug}/cho-duyet`}
                        target="_blank"
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <Eye className="w-4 h-4" />
                        Xem truyện
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10" />

                {/* PENDING: Show Approve and Reject */}
                {approvalStatus === "PENDING" && (
                    <>
                        <DropdownMenuItem onClick={handleApprove} className="flex items-center gap-2 cursor-pointer text-green-400 focus:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            Duyệt truyện
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsRejectOpen(true)} className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400">
                            <XCircle className="w-4 h-4" />
                            Từ chối
                        </DropdownMenuItem>
                    </>
                )}

                {/* APPROVED: Show Soft Delete */}
                {approvalStatus === "APPROVED" && (
                    <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400">
                        <Trash2 className="w-4 h-4" />
                        Ẩn truyện
                    </DropdownMenuItem>
                )}

                {/* REJECTED: Show Restore */}
                {approvalStatus === "REJECTED" && (
                    <DropdownMenuItem onClick={handleRestore} className="flex items-center gap-2 cursor-pointer text-green-400 focus:text-green-400">
                        <RotateCcw className="w-4 h-4" />
                        Khôi phục (Duyệt)
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
