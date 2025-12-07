import { getPendingNovels, approveNovel, rejectNovel } from "@/actions/novel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, BookOpen, User, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { revalidatePath } from "next/cache";
import NovelRejectModal from "@/components/admin/novel-reject-modal";

// Nation labels
const NATION_LABELS: Record<string, { label: string; color: string }> = {
    CN: { label: "Trung Quốc", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    JP: { label: "Nhật Bản", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
    KR: { label: "Hàn Quốc", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    VN: { label: "Việt Nam", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    OTHER: { label: "Khác", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

// Format labels
const FORMAT_LABELS: Record<string, { label: string; color: string }> = {
    WN: { label: "Web Novel", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    LN: { label: "Light Novel", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

export default async function PendingNovelsPage() {
    const result = await getPendingNovels();

    if (result.error || !result.novels) {
        return (
            <div className="p-6">
                <div className="text-red-500">{result.error || "Không thể tải danh sách"}</div>
            </div>
        );
    }

    const novels = result.novels;

    async function handleApprove(novelId: number) {
        "use server";
        await approveNovel(novelId);
        revalidatePath("/admin/novels/pending");
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Truyện chờ duyệt</h1>
                    <p className="text-[#9CA3AF] mt-1">
                        {novels.length > 0
                            ? `Có ${novels.length} truyện đang chờ phê duyệt`
                            : "Không có truyện nào chờ duyệt"}
                    </p>
                </div>
                <Link href="/admin/novels">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Tất cả truyện
                    </Button>
                </Link>
            </div>

            {/* Novel Grid */}
            {novels.length === 0 ? (
                <div className="bg-[#1E293B] rounded-xl border border-white/10 p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium text-white mb-2">Tất cả đã được duyệt!</h3>
                    <p className="text-[#9CA3AF]">Không có truyện nào đang chờ phê duyệt.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {novels.map((novel) => {
                        const nation = NATION_LABELS[novel.nation || "OTHER"] || NATION_LABELS.OTHER;
                        const format = FORMAT_LABELS[novel.novelFormat || "WN"] || FORMAT_LABELS.WN;

                        return (
                            <div
                                key={novel.id}
                                className="bg-[#1E293B] rounded-xl border border-white/10 overflow-hidden hover:border-amber-500/30 transition-colors group"
                            >
                                {/* Cover & Info */}
                                <div className="flex gap-4 p-4">
                                    {/* Cover */}
                                    <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-[#0B0C10]">
                                        {novel.coverImage ? (
                                            <img
                                                src={novel.coverImage}
                                                alt={novel.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white line-clamp-2 group-hover:text-amber-400 transition-colors">
                                            {novel.title}
                                        </h3>
                                        <p className="text-sm text-[#9CA3AF] mt-1">{novel.author}</p>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <Badge variant="outline" className={nation.color}>
                                                {nation.label}
                                            </Badge>
                                            <Badge variant="outline" className={format.color}>
                                                {format.label}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div className="px-4 py-3 bg-[#0B0C10]/50 border-t border-white/5 flex items-center gap-4 text-xs text-[#9CA3AF]">
                                    <div className="flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{novel._count.volumes} tập</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{novel.uploader.name || novel.uploader.username}</span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-auto">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{new Date(novel.createdAt).toLocaleDateString("vi-VN")}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-4 border-t border-white/5 flex items-center gap-2">
                                    <Link href={`/truyen/${novel.slug}/cho-duyet`} target="_blank" className="flex-1">
                                        <Button
                                            variant="outline"
                                            className="w-full border-white/10 hover:bg-white/5"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Xem
                                        </Button>
                                    </Link>
                                    <form action={handleApprove.bind(null, novel.id)} className="flex-1">
                                        <Button
                                            type="submit"
                                            className="w-full bg-green-600 hover:bg-green-500 text-white"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Duyệt
                                        </Button>
                                    </form>
                                    <NovelRejectModal novelId={novel.id} novelTitle={novel.title} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
