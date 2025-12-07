import { getAllAnnouncements, deleteAnnouncement, toggleAnnouncement } from "@/actions/announcements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Power, Plus, Edit, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface Announcement {
    id: string;
    title: string;
    content: string;
    isActive: boolean;
    startDate: Date;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export default async function AnnouncementsPage() {
    const { announcements, error } = await getAllAnnouncements();

    if (error || !announcements) {
        return <div className="text-red-500">Không thể tải danh sách thông báo</div>;
    }

    const now = new Date();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Thông báo</h1>
                    <p className="text-gray-400">Quản lý banner thông báo cho người dùng.</p>
                </div>
                <Link href="/admin/announcements/new">
                    <Button className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0B0C10] font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        Tạo thông báo
                    </Button>
                </Link>
            </div>

            {/* Announcements Table */}
            <div className="bg-[#1E293B] rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Tiêu đề</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Trạng thái</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Thời gian</th>
                            <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {announcements.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                    Chưa có thông báo nào. Tạo thông báo đầu tiên!
                                </td>
                            </tr>
                        ) : (
                            (announcements as Announcement[]).map((ann: Announcement) => {
                                const isExpired = ann.endDate && new Date(ann.endDate) < now;
                                const isNotStarted = new Date(ann.startDate) > now;
                                const isLive = ann.isActive && !isExpired && !isNotStarted;

                                return (
                                    <tr key={ann.id} className="border-b border-white/5 hover:bg-white/2">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{ann.title}</div>
                                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                {ann.content.replace(/<[^>]*>/g, '').slice(0, 80)}...
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {isLive ? (
                                                    <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Đang hiển thị
                                                    </Badge>
                                                ) : isExpired ? (
                                                    <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/20">
                                                        Đã hết hạn
                                                    </Badge>
                                                ) : isNotStarted ? (
                                                    <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/20">
                                                        Chưa bắt đầu
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/20">
                                                        <EyeOff className="w-3 h-3 mr-1" />
                                                        Đã tắt
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            <div>Từ: {new Date(ann.startDate).toLocaleDateString("vi-VN")}</div>
                                            <div>
                                                Đến: {ann.endDate
                                                    ? new Date(ann.endDate).toLocaleDateString("vi-VN")
                                                    : "Không giới hạn"
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/announcements/${ann.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <form action={async () => {
                                                    "use server";
                                                    await toggleAnnouncement(ann.id);
                                                }}>
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-8 w-8 ${ann.isActive ? "text-green-500 hover:text-green-400" : "text-gray-400 hover:text-white"}`}
                                                        title={ann.isActive ? "Tắt thông báo" : "Bật thông báo"}
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                                <form action={async () => {
                                                    "use server";
                                                    await deleteAnnouncement(ann.id);
                                                }}>
                                                    <Button
                                                        type="submit"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                                                        title="Xóa thông báo"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
