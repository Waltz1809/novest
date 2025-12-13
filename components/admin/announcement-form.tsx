"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RichTextEditor from "@/components/editor/rich-text-editor";
import { createAnnouncement, updateAnnouncement } from "@/actions/announcements";

interface AnnouncementFormProps {
    announcement?: {
        id: string;
        title: string;
        content: string;
        startDate: Date;
        endDate: Date | null;
        isActive: boolean;
    };
}

export default function AnnouncementForm({ announcement }: AnnouncementFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [title, setTitle] = useState(announcement?.title || "");
    const [content, setContent] = useState(announcement?.content || "");
    const [startDate, setStartDate] = useState(
        announcement?.startDate
            ? new Date(announcement.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        announcement?.endDate
            ? new Date(announcement.endDate).toISOString().split('T')[0]
            : ""
    );
    const [error, setError] = useState("");

    const isEdit = !!announcement;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Vui lòng nhập tiêu đề");
            return;
        }

        if (!content.trim() || content === "<p></p>") {
            setError("Vui lòng nhập nội dung");
            return;
        }

        startTransition(async () => {
            const data = {
                title: title.trim(),
                content,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
            };

            const result = isEdit
                ? await updateAnnouncement(announcement.id, data)
                : await createAnnouncement(data);

            if (result.error) {
                setError(result.error);
            } else {
                router.push("/admin/announcements");
                router.refresh();
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/announcements">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {isEdit ? "Chỉnh sửa thông báo" : "Tạo thông báo mới"}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Thông báo sẽ hiển thị cho người dùng mỗi ngày một lần.
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Tiêu đề (chỉ admin thấy)
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="VD: Thông báo bảo trì 15/12"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-foreground placeholder:text-gray-400 focus:border-amber-500 outline-none transition-colors"
                        disabled={isPending}
                    />
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Nội dung thông báo
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                        Hỗ trợ văn bản, emoji, và ảnh. Giữ ngắn gọn để hiển thị tốt trên mobile.
                    </p>
                    <RichTextEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Nhập nội dung thông báo..."
                    />
                </div>

                {/* Date Range */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-foreground mb-4">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Thời gian hiển thị
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-muted-foreground mb-2">Từ ngày</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-foreground focus:border-amber-500 outline-none transition-colors"
                                disabled={isPending}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-2">Đến ngày (để trống = không giới hạn)</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-foreground focus:border-amber-500 outline-none transition-colors"
                                disabled={isPending}
                            />
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link href="/admin/announcements">
                        <Button type="button" variant="ghost" disabled={isPending}>
                            Hủy
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0B0C10] font-bold"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isEdit ? "Lưu thay đổi" : "Tạo thông báo"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
