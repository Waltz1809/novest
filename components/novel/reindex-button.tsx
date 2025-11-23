"use client";

import { reindexAllNovels } from "@/actions/novel";
import { RefreshCw } from "lucide-react";
import { useTransition } from "react";

export default function ReindexButton() {
    const [isPending, startTransition] = useTransition();

    const handleReindex = () => {
        if (confirm("Bạn có chắc chắn muốn đánh lại index tìm kiếm cho toàn bộ truyện? Việc này có thể mất thời gian.")) {
            startTransition(async () => {
                try {
                    await reindexAllNovels();
                    alert("Đã cập nhật index tìm kiếm thành công!");
                } catch (error) {
                    console.error(error);
                    alert("Có lỗi xảy ra khi cập nhật index.");
                }
            });
        }
    };

    return (
        <button
            onClick={handleReindex}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Cập nhật lại index tìm kiếm"
        >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
            Re-index
        </button>
    );
}
