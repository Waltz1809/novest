"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Eye,
    EyeOff,
    Calendar,
    Clock,
    Loader2,
    Send,
    X,
    AlertTriangle,
} from "lucide-react";
import { publishChapter, schedulePublish, cancelScheduledPublish } from "@/actions/chapter";

interface ChapterDraftControlsProps {
    chapterId: number;
    isDraft: boolean;
    publishAt?: Date | null;
}

export default function ChapterDraftControls({
    chapterId,
    isDraft,
    publishAt,
}: ChapterDraftControlsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("12:00");
    const [error, setError] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);

    const isScheduled = !!publishAt && new Date(publishAt) > new Date();

    const handlePublish = () => {
        startTransition(async () => {
            const result = await publishChapter(chapterId);
            if (result.error) {
                setError(result.error);
            } else {
                setShowConfirm(false);
                router.refresh();
            }
        });
    };

    const handleSchedule = () => {
        if (!scheduleDate) {
            setError("Vui lòng chọn ngày xuất bản");
            return;
        }

        const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (scheduledDateTime <= new Date()) {
            setError("Thời gian xuất bản phải ở tương lai");
            return;
        }

        startTransition(async () => {
            const result = await schedulePublish(chapterId, scheduledDateTime);
            if (result.error) {
                setError(result.error);
            } else {
                setShowSchedule(false);
                setScheduleDate("");
                router.refresh();
            }
        });
    };

    const handleCancelSchedule = () => {
        startTransition(async () => {
            const result = await cancelScheduledPublish(chapterId);
            if (result.error) {
                setError(result.error);
            } else {
                router.refresh();
            }
        });
    };

    // Format scheduled time
    const formatScheduled = (date: Date) => {
        return new Date(date).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Published state
    if (!isDraft && !isScheduled) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg">
                <Eye className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Đã xuất bản</span>
            </div>
        );
    }

    // Scheduled state
    if (isScheduled && publishAt) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400 font-medium">
                        Lên lịch: {formatScheduled(publishAt)}
                    </span>
                </div>
                <button
                    onClick={handleCancelSchedule}
                    disabled={isPending}
                    className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                    title="Hủy lịch"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <X className="w-4 h-4" />
                    )}
                </button>
            </div>
        );
    }

    // Draft state - show controls
    return (
        <>
            <div className="flex items-center gap-2">
                {/* Draft Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-lg">
                    <EyeOff className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400 font-medium">Bản nháp</span>
                </div>

                {/* Publish Button */}
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={isPending}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Xuất bản</span>
                </button>

                {/* Schedule Button */}
                <button
                    onClick={() => setShowSchedule(true)}
                    disabled={isPending}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Lên lịch</span>
                </button>
            </div>

            {/* Publish Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => !isPending && setShowConfirm(false)}
                    />
                    <div className="relative bg-[#1E293B] rounded-xl border border-white/10 shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Xuất bản chương?</h3>
                            <p className="text-sm text-[#9CA3AF] mb-6">
                                Chương sẽ được hiển thị công khai và người đọc theo dõi sẽ nhận được thông báo.
                            </p>

                            {error && (
                                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 bg-white/5 text-[#9CA3AF] rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handlePublish}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Xuất bản
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Modal */}
            {showSchedule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => !isPending && setShowSchedule(false)}
                    />
                    <div className="relative bg-[#1E293B] rounded-xl border border-white/10 shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-400" />
                                Lên lịch xuất bản
                            </h3>
                            <button
                                onClick={() => setShowSchedule(false)}
                                className="text-[#9CA3AF] hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-[#9CA3AF] mb-2 block">Ngày</label>
                                <input
                                    type="date"
                                    value={scheduleDate}
                                    onChange={(e) => {
                                        setScheduleDate(e.target.value);
                                        setError("");
                                    }}
                                    min={new Date().toISOString().split("T")[0]}
                                    className="w-full px-4 py-2.5 bg-[#0B0C10] border border-white/10 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-[#9CA3AF] mb-2 block">Giờ</label>
                                <input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[#0B0C10] border border-white/10 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-400/80">
                                    Chương sẽ tự động xuất bản vào thời điểm đã chọn. Bạn có thể hủy lịch bất kỳ lúc nào.
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowSchedule(false)}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 bg-white/5 text-[#9CA3AF] rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSchedule}
                                    disabled={isPending || !scheduleDate}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Calendar className="w-4 h-4" />
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
