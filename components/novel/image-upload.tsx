"use client";

import { UploadButton } from "@/lib/uploadthing";
import { X } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}

export default function ImageUpload({
    value,
    onChange,
    disabled,
}: ImageUploadProps) {
    if (value) {
        return (
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <button
                    onClick={() => onChange("")}
                    className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                    type="button"
                    disabled={disabled}
                >
                    <X className="w-4 h-4" />
                </button>
                <Image
                    src={value}
                    alt="Upload"
                    fill
                    className="object-cover"
                />
            </div>
        );
    }

    return (
        <div className="w-full h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-4 hover:bg-gray-100 transition-colors">
            <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                        onChange(res[0].url);
                        alert("Upload thành công!");
                    }
                }}
                onUploadError={(error: Error) => {
                    alert(`Lỗi upload: ${error.message}`);
                }}
            />
            <p className="text-xs text-gray-500">
                Hỗ trợ ảnh tối đa 4MB
            </p>
        </div>
    );
}
