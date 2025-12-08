"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Tag, BookOpen } from "lucide-react";
import { createGenre, updateGenre, deleteGenre } from "@/actions/genre";

interface Genre {
    id: number;
    name: string;
    slug: string;
    _count: {
        novels: number;
    };
}

interface GenresClientProps {
    genres: Genre[];
}

export default function GenresClient({ genres }: GenresClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleCreate = () => {
        if (!newName.trim()) return;
        setError("");
        setSuccess("");

        startTransition(async () => {
            const result = await createGenre(newName);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(result.success || "Đã tạo!");
                setNewName("");
                router.refresh();
            }
        });
    };

    const handleUpdate = (id: number) => {
        if (!editName.trim()) return;
        setError("");
        setSuccess("");

        startTransition(async () => {
            const result = await updateGenre(id, editName);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(result.success || "Đã cập nhật!");
                setEditingId(null);
                setEditName("");
                router.refresh();
            }
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (!confirm(`Xóa thể loại "${name}"?`)) return;
        setError("");
        setSuccess("");

        startTransition(async () => {
            const result = await deleteGenre(id);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(result.success || "Đã xóa!");
                router.refresh();
            }
        });
    };

    const startEdit = (genre: Genre) => {
        setEditingId(genre.id);
        setEditName(genre.name);
        setError("");
        setSuccess("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quản lý Thể loại</h1>
                    <p className="text-[#9CA3AF] mt-1">
                        {genres.length} thể loại
                    </p>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                    {success}
                </div>
            )}

            {/* Add new genre */}
            <div className="bg-[#1E293B] rounded-xl border border-white/10 p-4">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#F59E0B]" />
                    Thêm thể loại mới
                </h2>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        placeholder="Tên thể loại (VD: Huyền Huyễn, Kiếm Hiệp...)"
                        className="flex-1 px-4 py-3 bg-[#0B0C10] border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none"
                        disabled={isPending}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={isPending || !newName.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Plus className="w-5 h-5" />
                        )}
                        Thêm
                    </button>
                </div>
            </div>

            {/* Genres list */}
            <div className="bg-[#1E293B] rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Tag className="w-5 h-5 text-[#F59E0B]" />
                        Danh sách thể loại
                    </h2>
                </div>

                {genres.length === 0 ? (
                    <div className="p-8 text-center text-[#9CA3AF]">
                        Chưa có thể loại nào. Thêm thể loại đầu tiên ở trên!
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {genres.map((genre) => (
                            <div
                                key={genre.id}
                                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                            >
                                {editingId === genre.id ? (
                                    /* Edit mode */
                                    <>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleUpdate(genre.id);
                                                if (e.key === "Escape") cancelEdit();
                                            }}
                                            className="flex-1 px-3 py-2 bg-[#0B0C10] border border-[#F59E0B] rounded-lg text-white focus:ring-2 focus:ring-[#F59E0B]/20 outline-none"
                                            autoFocus
                                            disabled={isPending}
                                        />
                                        <button
                                            onClick={() => handleUpdate(genre.id)}
                                            disabled={isPending}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                                        >
                                            Lưu
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            disabled={isPending}
                                            className="px-4 py-2 text-[#9CA3AF] hover:text-white transition-colors"
                                        >
                                            Hủy
                                        </button>
                                    </>
                                ) : (
                                    /* View mode */
                                    <>
                                        <div className="flex-1">
                                            <span className="text-white font-medium">{genre.name}</span>
                                            <span className="text-[#9CA3AF] text-sm ml-2">/{genre.slug}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[#9CA3AF] text-sm">
                                            <BookOpen className="w-4 h-4" />
                                            <span>{genre._count.novels} truyện</span>
                                        </div>
                                        <button
                                            onClick={() => startEdit(genre)}
                                            disabled={isPending}
                                            className="p-2 text-[#9CA3AF] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-colors"
                                            title="Sửa"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(genre.id, genre.name)}
                                            disabled={isPending || genre._count.novels > 0}
                                            className="p-2 text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title={genre._count.novels > 0 ? "Không thể xóa - có truyện đang dùng" : "Xóa"}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
