import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, BookOpen, Eye } from "lucide-react";

import ReindexButton from "@/components/novel/reindex-button";

export const revalidate = 0; // Dynamic

export default async function NovelsPage() {
    const novels = await db.novel.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { volumes: true },
            },
            volumes: {
                select: {
                    _count: {
                        select: { chapters: true }
                    }
                }
            }
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Truyện</h1>
                    <p className="text-gray-500">Danh sách tất cả truyện trong hệ thống.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ReindexButton />
                    <Link
                        href="/dashboard/novels/create"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm truyện mới
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Ảnh bìa</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Tên truyện</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Tác giả</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Trạng thái</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-center">Số lượng</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {novels.length > 0 ? (
                                novels.map((novel) => {
                                    const chapterCount = novel.volumes.reduce((acc, vol) => acc + vol._count.chapters, 0);

                                    return (
                                        <tr key={novel.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="w-10 h-14 relative bg-gray-100 rounded overflow-hidden border border-gray-200">
                                                    {novel.coverImage ? (
                                                        <Image
                                                            src={novel.coverImage}
                                                            alt={novel.title}
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <BookOpen className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{novel.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                    {novel.slug}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{novel.author}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${novel.status === "ONGOING"
                                                        ? "bg-green-100 text-green-800"
                                                        : novel.status === "COMPLETED"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-gray-100 text-gray-800"
                                                        }`}
                                                >
                                                    {novel.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col gap-1 text-xs text-gray-500">
                                                    <span className="font-medium text-gray-700">{novel._count.volumes} Tập</span>
                                                    <span>{chapterCount} Chương</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/dashboard/novels/edit/${novel.id}`}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Chưa có truyện nào. Hãy thêm truyện mới!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
