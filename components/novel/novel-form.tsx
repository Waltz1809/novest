"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/novel/image-upload";
import GenreSelector from "@/components/novel/genre-selector";
import { createNovel, updateNovel } from "@/actions/novel";
import { getGenres } from "@/actions/search";
import { Loader2, Save, Wand2 } from "lucide-react";
import { toSlug } from "@/lib/utils";

interface Genre {
    id: number;
    name: string;
}

interface NovelFormProps {
    initialData?: {
        id: number;
        title: string;
        slug: string;
        author: string;
        description: string | null;
        status: string;
        coverImage: string | null;
        alternativeTitles: string | null;
        genres: { id: number; name: string }[];
    } | null;
    genres: Genre[];
}

interface FormData {
    title: string;
    slug: string;
    author: string;
    description: string;
    status: string;
    coverImage: string;
    alternativeTitles: string;
    genreIds: number[];
}

export default function NovelForm({ initialData, genres }: NovelFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            title: initialData?.title || "",
            slug: initialData?.slug || "",
            author: initialData?.author || "",
            description: initialData?.description || "",
            status: initialData?.status || "ONGOING",
            coverImage: initialData?.coverImage || "",
            alternativeTitles: initialData?.alternativeTitles || "",
            genreIds: initialData?.genres.map((g) => g.id) || [],
        },
    });

    const coverImage = watch("coverImage");
    const title = watch("title");
    const genreIds = watch("genreIds");

    const generateSlug = () => {
        setValue("slug", toSlug(title));
    };

    const onSubmit = (data: FormData) => {
        startTransition(async () => {
            try {
                if (initialData) {
                    await updateNovel(initialData.id, data);
                    alert("Cập nhật truyện thành công!");
                } else {
                    await createNovel(data);
                    alert("Tạo truyện thành công!");
                }
                router.push("/dashboard/novels");
                router.refresh();
            } catch (error) {
                console.error(error);
                alert("Có lỗi xảy ra.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Column: Cover Image */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-[#0f172a] p-4 md:p-6 rounded-xl shadow-md border border-white/10 overflow-hidden">
                        <label className="block text-sm font-medium text-[#9CA3AF] uppercase mb-3 tracking-wide">
                            Ảnh bìa
                        </label>
                        <ImageUpload
                            value={coverImage}
                            onChange={(url) => setValue("coverImage", url)}
                            disabled={isPending}
                        />
                    </div>
                </div>

                {/* Right Column: Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0f172a] p-4 md:p-6 rounded-xl shadow-md border border-white/10 space-y-5 md:space-y-6 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            <div className="space-y-2">
                                <label className="text-xs text-[#9CA3AF] uppercase block tracking-wide">
                                    Tên truyện
                                </label>
                                <input
                                    {...register("title", { required: "Vui lòng nhập tên truyện" })}
                                    className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-gray-100 placeholder:text-gray-600 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all"
                                    placeholder="Nhập tên truyện..."
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-[#9CA3AF] uppercase block tracking-wide">
                                    Slug (URL)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        {...register("slug", { required: "Vui lòng nhập slug" })}
                                        className="flex-1 px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-gray-100 placeholder:text-gray-600 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all"
                                        placeholder="ten-truyen-slug"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateSlug}
                                        className="p-3 bg-white/5 text-gray-400 rounded-lg hover:bg-[#F59E0B]/10 hover:text-[#F59E0B] transition-colors"
                                        title="Tự động tạo từ tên truyện"
                                    >
                                        <Wand2 className="w-5 h-5" />
                                    </button>
                                </div>
                                {errors.slug && (
                                    <p className="text-xs text-red-500">{errors.slug.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-[#9CA3AF] uppercase block tracking-wide">
                                    Tác giả
                                </label>
                                <input
                                    {...register("author", { required: "Vui lòng nhập tác giả" })}
                                    className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-gray-100 placeholder:text-gray-600 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all"
                                    placeholder="Tên tác giả..."
                                />
                                {errors.author && (
                                    <p className="text-xs text-red-500">{errors.author.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-[#9CA3AF] uppercase block tracking-wide">
                                    Trạng thái
                                </label>
                                <select
                                    {...register("status")}
                                    className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-gray-100 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all appearance-none"
                                >
                                    <option value="ONGOING">Đang ra (ONGOING)</option>
                                    <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                                    <option value="PAUSED">Tạm dừng (PAUSED)</option>
                                </select>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-xs text-[#9CA3AF] uppercase block tracking-wide">
                                    Tên khác (Alternative Titles)
                                </label>
                                <input
                                    {...register("alternativeTitles")}
                                    className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-gray-100 placeholder:text-gray-600 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all"
                                    placeholder="Tên gọi khác, ngăn cách bởi dấu phẩy..."
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-xs text-[#9CA3AF] uppercase block tracking-wide">
                                    Thể loại
                                </label>
                                <GenreSelector
                                    genres={genres}
                                    selectedValues={genreIds}
                                    onChange={(values) => setValue("genreIds", values)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-[#9CA3AF] uppercase block tracking-wide">
                                Mô tả
                            </label>
                            <textarea
                                {...register("description")}
                                rows={6}
                                className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-gray-100 placeholder:text-gray-600 focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/20 outline-none transition-all resize-none"
                                placeholder="Mô tả nội dung truyện..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end sticky bottom-4 md:static z-10">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 px-8 py-3 bg-[#F59E0B] text-[#0B0C10] font-bold rounded-lg hover:bg-[#FBBF24] transition-all shadow-lg shadow-[#F59E0B]/20 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto justify-center"
                        >
                            {isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {initialData ? "Lưu thay đổi" : "Tạo truyện mới"}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
