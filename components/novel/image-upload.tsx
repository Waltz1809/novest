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
            <div className="relative w-full h-64 bg-[#020617] rounded-lg overflow-hidden border border-white/10 group">
                <button
                    onClick={() => onChange("")}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
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
        <div className="w-full h-64 bg-[#020617] border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-4 hover:bg-[#F59E0B]/5 hover:border-[#F59E0B]/30 transition-all group overflow-hidden">
            <div className="scale-90 sm:scale-100 max-w-full overflow-hidden px-4">
                <UploadButton
                    endpoint="imageUploader"
                    appearance={{
                        button: "bg-[#F59E0B] text-[#0B0C10] font-bold hover:bg-[#FBBF24] transition-colors",
                        allowedContent: "text-gray-400"
                    }}
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
            </div>
            <p className="text-xs text-gray-500 group-hover:text-[#F59E0B]/70 transition-colors">
                Hỗ trợ ảnh tối đa 4MB
            </p>
        </div>
    );
}
