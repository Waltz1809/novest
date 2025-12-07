"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Bug,
    FileWarning,
    HelpCircle,
    FileEdit,
    RefreshCw,
    Loader2,
    Send,
    X,
    ChevronRight,
} from "lucide-react";
import { createTicket } from "@/actions/ticket";

interface TicketZoneProps {
    novelId?: number;
    novelTitle?: string;
    chapterId?: number;
    chapterTitle?: string;
    defaultType?: string;
}

const TICKET_TYPES = [
    {
        id: "REPORT",
        label: "Báo cáo",
        description: "Báo cáo nội dung vi phạm",
        icon: FileWarning,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        subTypes: [
            { id: "NOVEL_QUALITY", label: "Chất lượng truyện kém" },
            { id: "SPAM_COMMENT", label: "Bình luận spam" },
            { id: "TOS_VIOLATION", label: "Vi phạm điều khoản" },
            { id: "COPYRIGHT", label: "Vi phạm bản quyền" },
        ],
    },
    {
        id: "BUG",
        label: "Lỗi hệ thống",
        description: "Báo lỗi kỹ thuật của website",
        icon: Bug,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
    },
    {
        id: "SUPPORT",
        label: "Hỗ trợ",
        description: "Câu hỏi và yêu cầu hỗ trợ",
        icon: HelpCircle,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
    },
    {
        id: "FIX_CHAPTER",
        label: "Sửa chương",
        description: "Yêu cầu sửa nội dung chương",
        icon: FileEdit,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
        requiresChapter: true,
    },
    {
        id: "STATUS_CHANGE",
        label: "Đổi trạng thái",
        description: "Yêu cầu đổi trạng thái truyện",
        icon: RefreshCw,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
        requiresNovel: true,
        subTypes: [
            { id: "REQUEST_COMPLETE", label: "Đánh dấu hoàn thành" },
            { id: "REQUEST_HIATUS", label: "Tạm dừng" },
            { id: "REQUEST_DROPPED", label: "Ngưng dịch" },
        ],
    },
];

export default function TicketZone({
    novelId,
    novelTitle,
    chapterId,
    chapterTitle,
    defaultType,
}: TicketZoneProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [step, setStep] = useState<"type" | "form">("type");
    const [selectedType, setSelectedType] = useState<string>(defaultType || "");
    const [selectedSubType, setSelectedSubType] = useState<string>("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const currentType = TICKET_TYPES.find((t) => t.id === selectedType);

    const handleSelectType = (typeId: string) => {
        setSelectedType(typeId);
        setSelectedSubType("");
        setStep("form");
    };

    const handleSubmit = () => {
        if (!title.trim() || title.length < 5) {
            setError("Tiêu đề phải có ít nhất 5 ký tự");
            return;
        }
        if (!description.trim() || description.length < 10) {
            setError("Mô tả phải có ít nhất 10 ký tự");
            return;
        }

        startTransition(async () => {
            const result = await createTicket({
                mainType: selectedType,
                subType: selectedSubType || undefined,
                title: title.trim(),
                description: description.trim(),
                novelId: novelId || undefined,
                chapterId: chapterId || undefined,
            });

            if (result.error) {
                setError(result.error);
            } else {
                alert("Ticket đã được gửi thành công!");
                router.push("/studio/tickets");
            }
        });
    };

    const reset = () => {
        setStep("type");
        setSelectedType("");
        setSelectedSubType("");
        setTitle("");
        setDescription("");
        setError("");
    };

    return (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Gửi Ticket Hỗ Trợ</h3>
                <p className="text-sm text-[#9CA3AF] mt-1">
                    Chọn loại yêu cầu và mô tả chi tiết vấn đề của bạn
                </p>
            </div>

            {/* Content */}
            <div className="p-4">
                {step === "type" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {TICKET_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isDisabled =
                                (type.requiresChapter && !chapterId) ||
                                (type.requiresNovel && !novelId);

                            return (
                                <button
                                    key={type.id}
                                    onClick={() => !isDisabled && handleSelectType(type.id)}
                                    disabled={isDisabled}
                                    className={`flex items-start gap-3 p-4 rounded-lg border transition-all text-left ${isDisabled
                                            ? "border-white/5 opacity-40 cursor-not-allowed"
                                            : "border-white/10 hover:border-white/20 hover:bg-white/5 cursor-pointer"
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${type.bgColor}`}>
                                        <Icon className={`w-5 h-5 ${type.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-white">{type.label}</h4>
                                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                                            {type.description}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-[#9CA3AF] mt-1" />
                                </button>
                            );
                        })}
                    </div>
                )}

                {step === "form" && currentType && (
                    <div className="space-y-4">
                        {/* Type badge */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${currentType.bgColor}`}>
                                    <currentType.icon className={`w-4 h-4 ${currentType.color}`} />
                                </div>
                                <span className="font-medium text-white">{currentType.label}</span>
                            </div>
                            <button
                                onClick={reset}
                                className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
                            >
                                Đổi loại
                            </button>
                        </div>

                        {/* Context info */}
                        {(novelTitle || chapterTitle) && (
                            <div className="p-3 bg-white/5 rounded-lg text-sm">
                                {novelTitle && (
                                    <p className="text-[#9CA3AF]">
                                        Truyện: <span className="text-white">{novelTitle}</span>
                                    </p>
                                )}
                                {chapterTitle && (
                                    <p className="text-[#9CA3AF] mt-1">
                                        Chương: <span className="text-white">{chapterTitle}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Subtype selector */}
                        {currentType.subTypes && currentType.subTypes.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm text-[#9CA3AF]">Loại cụ thể</label>
                                <div className="flex flex-wrap gap-2">
                                    {currentType.subTypes.map((sub) => (
                                        <button
                                            key={sub.id}
                                            onClick={() => setSelectedSubType(sub.id)}
                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selectedSubType === sub.id
                                                    ? "border-amber-500 bg-amber-500/20 text-amber-400"
                                                    : "border-white/10 text-[#9CA3AF] hover:border-white/20"
                                                }`}
                                        >
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-sm text-[#9CA3AF]">Tiêu đề</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Mô tả ngắn gọn vấn đề..."
                                className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                                maxLength={200}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm text-[#9CA3AF]">Mô tả chi tiết</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Mô tả chi tiết vấn đề bạn gặp phải, bao gồm các bước tái tạo (nếu là lỗi)..."
                                rows={5}
                                className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-white placeholder:text-gray-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                                maxLength={5000}
                            />
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                <X className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={reset}
                                disabled={isPending}
                                className="flex-1 px-4 py-2.5 bg-white/5 text-[#9CA3AF] rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isPending || !title.trim() || !description.trim()}
                                className="flex-1 px-4 py-2.5 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Gửi ticket
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
