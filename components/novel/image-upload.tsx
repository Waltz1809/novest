"use client";

import { getPresignedUrl } from "@/actions/upload";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    variant?: "cover" | "avatar"; // New: support different shapes
}

export default function ImageUpload({
    value,
    onChange,
    disabled,
    variant = "cover", // Default to rectangular cover
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size too large (max 5MB)");
                return;
            }

            setIsUploading(true);

            try {
                // 1. Get pre-signed URL
                const { success, url, fileUrl, error } = await getPresignedUrl(
                    file.name,
                    file.type
                );

                if (!success || !url || !fileUrl) {
                    throw new Error(error || "Failed to get upload URL");
                }

                // 2. Upload to R2
                const uploadResponse = await fetch(url, {
                    method: "PUT",
                    body: file,
                    headers: {
                        "Content-Type": file.type,
                    },
                });

                if (!uploadResponse.ok) {
                    throw new Error("Failed to upload to storage");
                }

                // 3. Update parent
                onChange(fileUrl);
                toast.success("Upload thành công!");
            } catch (error) {
                console.error("Upload error:", error);
                toast.error("Lỗi upload ảnh, vui lòng thử lại");
            } finally {
                setIsUploading(false);
            }
        },
        [onChange]
    );

    if (value) {
        const isAvatar = variant === "avatar";

        return (
            <div className={`relative bg-gray-50 border border-gray-200 group overflow-hidden ${isAvatar
                ? "w-48 h-48 rounded-full mx-auto"
                : "w-full h-64 rounded-lg"
                }`}>
                {/* Delete Button */}
                <button
                    onClick={() => onChange("")}
                    className="absolute top-2 right-2 z-20 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                    type="button"
                    disabled={disabled}
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Change Image Button */}
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            disabled={disabled || isUploading}
                            className="hidden"
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-white font-medium transition-colors">
                            <ImagePlus className="w-4 h-4" />
                            <span>Thay đổi ảnh</span>
                        </div>
                    </label>
                </div>

                <Image src={value} alt="Upload" fill className="object-cover" />
            </div>
        );
    }

    const isAvatar = variant === "avatar";

    return (
        <div className={`bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 hover:border-primary/30 transition-all group overflow-hidden relative ${isAvatar
            ? "w-48 h-48 rounded-full mx-auto"
            : "w-full h-64 rounded-lg"
            }`}>
            <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={disabled || isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
                {isUploading ? (
                    <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                    <ImagePlus className="w-10 h-10" />
                )}
                <p className="font-medium text-sm text-center px-4">
                    {isUploading ? "Đang tải lên..." : "Click hoặc kéo thả ảnh vào đây"}
                </p>
            </div>
            {!isAvatar && (
                <p className="text-xs text-gray-500 group-hover:text-primary/70 transition-colors">
                    Hỗ trợ ảnh tối đa 5MB
                </p>
            )}
        </div>
    );
}
