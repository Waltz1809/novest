"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/novel/image-upload";
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Cover Image */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-card p-6 rounded-xl shadow-md ">
                        <label className="block text-sm font-medium text-foreground mb-2">
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
                    <div className="bg-card p-6 rounded-xl shadow-md  space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Tên truyện
                                </label>
                                <input
                                    {...register("title", { required: "Vui lòng nhập tên truyện" })}
                                    className="w-full px-3 py-2  rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Nhập tên truyện..."
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Slug (URL)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        {...register("slug", { required: "Vui lòng nhập slug" })}
                                        className="flex-1 px-3 py-2  rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="ten-truyen-slug"
                                    />
                                    <button
                                        type="button"
                                        onClick={generateSlug}
                                        className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors"
                                        title="Tự động tạo từ tên truyện"
                                    >
                                        <Wand2 className="w-4 h-4" />
                                    </button>
                                </div>
                                {errors.slug && (
                                    <p className="text-xs text-red-500">{errors.slug.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Tác giả
                                </label>
                                <input
                                    {...register("author", { required: "Vui lòng nhập tác giả" })}
                                    className="w-full px-3 py-2  rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Tên tác giả..."
                                />
                                {errors.author && (
                                    <p className="text-xs text-red-500">{errors.author.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Trạng thái
                                </label>
                                <select
                                    {...register("status")}
                                    className="w-full px-3 py-2  rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                                >
                                    <option value="ONGOING">Đang ra (ONGOING)</option>
                                    <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                                    <option value="PAUSED">Tạm dừng (PAUSED)</option>
                                </select>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Tên khác (Alternative Titles)
                                </label>
                                <input
                                    {...register("alternativeTitles")}
                                    className="w-full px-3 py-2  rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Tên gọi khác, ngăn cách bởi dấu phẩy..."
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Thể loại
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2  rounded-lg">
                                    {genres.map((genre) => (
                                        <label key={genre.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                value={genre.id}
                                                {...register("genreIds")}
                                                className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                                            />
                                            {genre.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Mô tả
                            </label>
                            <textarea
                                {...register("description")}
                                rows={6}
                                className="w-full px-3 py-2  rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                placeholder="Mô tả nội dung truyện..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {initialData ? "Lưu thay đổi" : "Tạo truyện mới"}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
