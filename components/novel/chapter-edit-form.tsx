"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { updateChapter } from "@/actions/chapter";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/editor/rich-text-editor";

interface ChapterEditFormProps {
    novelId: number;
    novelSlug: string;
    chapter: {
        id: number;
        title: string;
        content: string;
        volumeId: number;
        order: number;
        price: number;
        isLocked: boolean;
        isDraft: boolean;
    };
    volumes: {
        id: number;
        title: string;
        order: number;
    }[];
}

interface FormData {
    title: string;
    content: string;
    volumeId: number;
    order: number;
    price: number;
    isLocked: boolean;
    isDraft: boolean;
}

export default function ChapterEditForm({ novelId, novelSlug, chapter, volumes }: ChapterEditFormProps) {
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
            title: chapter.title,
            content: chapter.content,
            volumeId: chapter.volumeId,
            order: chapter.order,
            price: chapter.price,
            isLocked: chapter.isLocked,
            isDraft: chapter.isDraft,
        },
    });

    const content = watch("content");

    const onSubmit = (data: FormData) => {
        startTransition(async () => {
            try {
                const result = await updateChapter(chapter.id, {
                    title: data.title,
                    content: data.content,
                    volumeId: Number(data.volumeId),
                    order: Number(data.order),
                    price: Number(data.price),
                    isLocked: data.isLocked,
                    isDraft: data.isDraft,
                });

                if (result.error) {
                    alert(result.error);
                } else {
                    alert("Cập nhật chương thành công!");
                    router.push(`/studio/novels/edit/${novelId}`);
                    router.refresh();
                }
            } catch (error) {
                console.error(error);
                alert("Có lỗi xảy ra.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center justify-between">
                <Link
                    href={`/studio/novels/edit/${novelId}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </Link>
                <h1 className="text-2xl font-bold text-foreground">Chỉnh sửa chương</h1>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-md  space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Tiêu đề chương</label>
                        <input
                            {...register("title", { required: "Vui lòng nhập tiêu đề" })}
                            className="w-full px-3 py-2  bg-background text-foreground rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Thuộc tập (Volume)</label>
                        <select
                            {...register("volumeId", { required: "Vui lòng chọn tập" })}
                            className="w-full px-3 py-2  rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                        >
                            {volumes.map((vol) => (
                                <option key={vol.id} value={vol.id}>
                                    Vol {vol.order}: {vol.title}
                                </option>
                            ))}
                        </select>
                        {errors.volumeId && <p className="text-xs text-red-500">{errors.volumeId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Số thứ tự (Order)</label>
                        <input
                            type="number"
                            {...register("order", { required: "Vui lòng nhập số thứ tự" })}
                            className="w-full px-3 py-2  rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        {errors.order && <p className="text-xs text-red-500">{errors.order.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Giá xu (0 = Miễn phí)</label>
                        <input
                            type="number"
                            {...register("price", { min: 0 })}
                            className="w-full px-3 py-2  rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isLocked"
                        {...register("isLocked")}
                        className="rounded  text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isLocked" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Khóa chương (VIP)
                    </label>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nội dung chương</label>
                    <RichTextEditor
                        content={content}
                        onChange={(html) => setValue("content", html)}
                    />
                    {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu thay đổi
                </button>
            </div>
        </form>
    );
}
