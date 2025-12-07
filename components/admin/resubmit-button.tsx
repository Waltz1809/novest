"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2, Send } from "lucide-react";
import { resubmitNovel } from "@/actions/novel";

interface ResubmitButtonProps {
    novelId: number;
    novelTitle: string;
    rejectionCount: number;
}

export function ResubmitButton({ novelId, novelTitle, rejectionCount }: ResubmitButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    const remainingAttempts = 3 - (rejectionCount || 0);

    const handleResubmit = () => {
        startTransition(async () => {
            const result = await resubmitNovel(novelId, message || undefined);
            if (result.error) {
                alert(result.error);
            } else {
                alert(result.success);
                setIsOpen(false);
                setMessage("");
                router.refresh();
            }
        });
    };

    if (remainingAttempts <= 0) {
        return null; // Should never happen, but just in case
    }

    return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        Gửi lại để duyệt
                    </h3>
                    <p className="text-sm text-amber-300/80 mt-1">
                        Còn {remainingAttempts} lần gửi. Sau 3 lần bị từ chối, truyện sẽ bị xóa vĩnh viễn.
                    </p>
                </div>
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-[#0B0C10] font-bold rounded-lg hover:bg-amber-400 transition-all"
                    >
                        <Send className="w-4 h-4" />
                        Xin duyệt lại
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
                    <div>
                        <label className="block text-sm font-medium text-amber-300 mb-2">
                            Ghi chú cho admin (tùy chọn)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Mô tả những thay đổi bạn đã thực hiện..."
                            rows={3}
                            className="w-full px-4 py-3 bg-[#0B0C10] border border-amber-500/30 rounded-lg text-white placeholder:text-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setMessage("");
                            }}
                            className="px-4 py-2 text-[#9CA3AF] hover:text-white transition-colors"
                            disabled={isPending}
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleResubmit}
                            disabled={isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-[#0B0C10] font-bold rounded-lg hover:bg-amber-400 transition-all disabled:opacity-50"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Gửi yêu cầu
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
