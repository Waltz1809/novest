"use client";

import { useState, useTransition } from "react";
import { Send, Crown, Loader2, CheckCircle } from "lucide-react";
import { submitNovelForApproval, requestVipStatus } from "@/actions/novel";
import { useRouter } from "next/navigation";

interface SubmitApprovalButtonProps {
    novelId: number;
    approvalStatus: string;
    vipStatus: string;
    totalWordCount: number;
    minWordsForApproval: number;
    minWordsForVip: number;
}

export function SubmitApprovalButton({
    novelId,
    approvalStatus,
    vipStatus,
    totalWordCount,
    minWordsForApproval,
    minWordsForVip,
}: SubmitApprovalButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const canSubmitForApproval = approvalStatus === "DRAFT" && totalWordCount >= minWordsForApproval;
    const canRequestVip = approvalStatus === "APPROVED" && vipStatus === "NONE" && totalWordCount >= minWordsForVip;

    const handleSubmitForApproval = () => {
        setMessage(null);
        startTransition(async () => {
            const result = await submitNovelForApproval(novelId);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else if (result.success) {
                setMessage({ type: "success", text: result.success });
                router.refresh();
            }
        });
    };

    const handleRequestVip = () => {
        setMessage(null);
        startTransition(async () => {
            const result = await requestVipStatus(novelId);
            if (result.error) {
                setMessage({ type: "error", text: result.error });
            } else if (result.success) {
                setMessage({ type: "success", text: result.success });
                router.refresh();
            }
        });
    };

    // Don't show anything if no action available
    if (!canSubmitForApproval && !canRequestVip && approvalStatus !== "PENDING" && vipStatus !== "PENDING") {
        return null;
    }

    return (
        <div className="space-y-3">
            {/* Submit for Approval Button (DRAFT novels only) */}
            {approvalStatus === "DRAFT" && (
                <button
                    onClick={handleSubmitForApproval}
                    disabled={isPending || !canSubmitForApproval}
                    className={`
                        w-full px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                        ${canSubmitForApproval
                            ? "bg-emerald-600 text-white hover:bg-emerald-500"
                            : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                        }
                    `}
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                    Gửi duyệt truyện
                </button>
            )}

            {/* Pending Status */}
            {approvalStatus === "PENDING" && (
                <div className="w-full px-4 py-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang chờ duyệt...
                </div>
            )}

            {/* Request VIP Button (APPROVED novels only) */}
            {approvalStatus === "APPROVED" && vipStatus === "NONE" && (
                <button
                    onClick={handleRequestVip}
                    disabled={isPending || !canRequestVip}
                    className={`
                        w-full px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                        ${canRequestVip
                            ? "bg-amber-500 text-[#0B0C10] hover:bg-amber-400"
                            : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                        }
                    `}
                    title={!canRequestVip ? `Cần tối thiểu ${minWordsForVip.toLocaleString()} chữ để yêu cầu VIP` : ""}
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Crown className="w-5 h-5" />
                    )}
                    Yêu cầu VIP ({totalWordCount.toLocaleString()}/{minWordsForVip.toLocaleString()} chữ)
                </button>
            )}

            {/* VIP Pending Status */}
            {vipStatus === "PENDING" && (
                <div className="w-full px-4 py-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center gap-2">
                    <Crown className="w-5 h-5" />
                    Đang chờ duyệt VIP...
                </div>
            )}

            {/* VIP Approved Status */}
            {vipStatus === "APPROVED" && (
                <div className="w-full px-4 py-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Truyện VIP
                </div>
            )}

            {/* Message */}
            {message && (
                <p className={`text-sm text-center ${message.type === "error" ? "text-red-400" : "text-emerald-400"}`}>
                    {message.text}
                </p>
            )}
        </div>
    );
}
