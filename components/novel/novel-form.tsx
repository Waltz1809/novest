"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/novel/image-upload";
import GenreSelector from "@/components/novel/genre-selector";
import { createNovel, updateNovel } from "@/actions/novel";
import { getGenres } from "@/actions/search";
import { Loader2, Save, Users, ChevronDown } from "lucide-react";
import { toSlug, countVietnameseWords } from "@/lib/utils";

interface Genre {
    id: number;
    name: string;
}

interface Group {
    id: string;
    name: string;
}

interface NovelFormProps {
    initialData?: {
        id: number;
        title: string;
        slug: string;
        author: string;
        artist?: string | null;
        description: string | null;
        status: string;
        coverImage: string | null;
        alternativeTitles: string | null;
        genres: { id: number; name: string }[];
        nation?: string | null;
        novelFormat?: string | null;
    } | null;
    genres: Genre[];
    groups?: Group[];
}

interface FormData {
    title: string;
    slug: string;
    author: string;
    artist: string;
    description: string;
    status: string;
    coverImage: string;
    alternativeTitles: string;
    genreIds: number[];
    nation: string;
    novelFormat: string;
    isR18: boolean;
    isLicensedDrop: boolean;
    groupId: string;
}

export default function NovelForm({ initialData, genres, groups = [] }: NovelFormProps) {
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
            artist: initialData?.artist || "",
            description: initialData?.description || "",
            status: initialData?.status || "ONGOING",
            coverImage: initialData?.coverImage || "",
            alternativeTitles: initialData?.alternativeTitles || "",
            genreIds: initialData?.genres.map((g) => g.id) || [],
            nation: initialData?.nation || "CN",
            novelFormat: initialData?.novelFormat || "WN",
            isR18: false,
            isLicensedDrop: false,
            groupId: "",
        },
    });

    const coverImage = watch("coverImage");
    const title = watch("title");
    const genreIds = watch("genreIds");

    // Calculate title word count for validation
    const titleWordCount = countVietnameseWords(title);

    // Auto-generate slug when title changes (only for new novels)
    useEffect(() => {
        if (!initialData && title) {
            setValue("slug", toSlug(title));
        }
    }, [title, initialData, setValue]);

    const onSubmit = (data: FormData) => {
        startTransition(async () => {
            try {
                if (initialData) {
                    await updateNovel(initialData.id, data);
                    alert("Cập nhật truyện thành công!");
                    router.push("/studio/novels");
                } else {
                    const result = await createNovel(data);

                    // Check for error (e.g., duplicate slug)
                    if (result && 'error' in result) {
                        alert(result.error);
                        return;
                    }

                    // Success - redirect to preview page
                    alert("Tạo truyện thành công! Đang chờ duyệt.");
                    router.push(`/truyen/${data.slug}/cho-duyet`);
                }
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
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <label className="block text-sm font-medium text-muted-foreground uppercase mb-3 tracking-wide">
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
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 space-y-5 md:space-y-6 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs text-muted-foreground uppercase tracking-wide">
                                        Tên truyện
                                    </label>
                                    <span className={`text-xs font-medium ${titleWordCount > 20 ? "text-red-500" :
                                            titleWordCount > 15 ? "text-amber-500" : "text-muted-foreground"
                                        }`}>
                                        {titleWordCount}/20 từ
                                    </span>
                                </div>
                                <input
                                    {...register("title", {
                                        required: "Vui lòng nhập tên truyện",
                                        validate: (value) => {
                                            const wordCount = countVietnameseWords(value);
                                            return wordCount <= 20 || `Tiêu đề quá dài (${wordCount}/20 từ)`;
                                        }
                                    })}
                                    className={`w-full px-4 py-3 rounded-lg bg-gray-50 border text-foreground placeholder:text-muted-foreground/50 focus:ring-2 outline-none transition-all ${errors.title || titleWordCount > 20
                                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                                            : "border-gray-200 focus:border-primary focus:ring-primary/20"
                                        }`}
                                    placeholder="Nhập tên truyện..."
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-500">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                    Slug (URL) - Tự động tạo
                                </label>
                                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 text-muted-foreground">
                                    <span className="text-sm">/truyen/</span>
                                    <span className="text-foreground font-mono">{watch("slug") || "..."}</span>
                                </div>
                                <input type="hidden" {...register("slug")} />
                                <p className="text-xs text-muted-foreground/70">
                                    Slug được tạo tự động từ tên truyện và không thể chỉnh sửa
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                    Tác giả
                                </label>
                                <input
                                    {...register("author", { required: "Vui lòng nhập tác giả" })}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Tên tác giả..."
                                />
                                {errors.author && (
                                    <p className="text-xs text-red-500">{errors.author.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                    Họa sĩ (tùy chọn)
                                </label>
                                <input
                                    {...register("artist")}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Tên họa sĩ (nếu có)..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                    Trạng thái
                                </label>
                                <select
                                    {...register("status")}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                >
                                    <option value="ONGOING">Đang ra (ONGOING)</option>
                                    <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                                    <option value="PAUSED">Tạm dừng (PAUSED)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                    Quốc gia
                                </label>
                                <select
                                    {...register("nation")}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                >
                                    <option value="CN">🇨🇳 Trung Quốc</option>
                                    <option value="KR">🇰🇷 Hàn Quốc</option>
                                    <option value="JP">🇯🇵 Nhật Bản</option>
                                    <option value="VN">🇻🇳 Việt Nam</option>
                                    <option value="OTHER">🌍 Khác</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                    Loại truyện
                                </label>
                                <select
                                    {...register("novelFormat")}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                >
                                    <option value="WN">Web Novel (WN)</option>
                                    <option value="LN">Light Novel (LN)</option>
                                </select>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                    Tên khác (Alternative Titles)
                                </label>
                                <input
                                    {...register("alternativeTitles")}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Tên gọi khác, ngăn cách bởi dấu phẩy..."
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                    Thể loại
                                </label>
                                <GenreSelector
                                    genres={genres}
                                    selectedValues={genreIds}
                                    onChange={(values) => setValue("genreIds", values)}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        {...register("isR18")}
                                        className="w-5 h-5 rounded border-2 border-red-300 bg-gray-50 text-red-500 focus:ring-red-500/20 focus:ring-2 cursor-pointer"
                                    />
                                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        Nội dung người lớn (R18) - Chỉ hiển thị với người dùng đủ 18 tuổi
                                    </span>
                                </label>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        {...register("isLicensedDrop")}
                                        className="w-5 h-5 rounded border-2 border-amber-300 bg-gray-50 text-amber-500 focus:ring-amber-500/20 focus:ring-2 cursor-pointer"
                                    />
                                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        Truyện bản quyền đã drop - Chặn đặt chương VIP
                                    </span>
                                </label>
                            </div>

                            {groups.length > 0 && (
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                        Nhóm dịch
                                    </label>
                                    <div className="relative">
                                        <select
                                            {...register("groupId")}
                                            className="w-full px-4 py-3 pr-16 rounded-lg bg-gray-50 border border-gray-200 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                        >
                                            <option value="">Novest Official (Mặc định)</option>
                                            {groups.map(group => (
                                                <option key={group.id} value={group.id}>{group.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                            <Users className="w-4 h-4 text-primary" />
                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground/70">
                                        Gán truyện cho nhóm dịch để các thành viên khác có thể chỉnh sửa
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground uppercase block tracking-wide">
                                Mô tả
                            </label>
                            <textarea
                                {...register("description")}
                                rows={6}
                                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                placeholder="Mô tả nội dung truyện..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end sticky bottom-4 md:static z-10">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto justify-center"
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
