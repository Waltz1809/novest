import Link from "next/link"
import Image from "next/image"
import { clsx } from "clsx"

interface NovelCardProps {
    novel: {
        id: number
        title: string
        slug: string
        author: string
        coverImage: string | null
        status: string
        createdAt: Date
    }
}

// Generate unique gradient based on title hash
function generateGradient(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 60) % 360;
    const hue3 = (hue1 + 120) % 360;

    return `linear-gradient(135deg, 
        hsl(${hue1}, 70%, 25%) 0%, 
        hsl(${hue2}, 60%, 20%) 50%, 
        hsl(${hue3}, 65%, 15%) 100%)`;
}

export function NovelCard({ novel }: NovelCardProps) {
    const gradientStyle = novel.coverImage ? {} : { background: generateGradient(novel.title) };

    return (
        <Link
            href={`/truyen/${novel.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-lg bg-[#1E293B] border border-[#374151] transition-all duration-300 hover:border-[#F59E0B]/60 hover:scale-[1.02]"
        >
            {/* Cover Image Area */}
            <div className="relative aspect-2/3 overflow-hidden bg-[#0B0C10]">
                {novel.coverImage && (novel.coverImage.startsWith("http") || novel.coverImage.startsWith("/")) ? (
                    <Image
                        src={novel.coverImage}
                        alt={novel.title}
                        fill
                        className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    // Generated gradient pattern with centered title
                    <div
                        className="flex h-full w-full items-center justify-center p-6 text-center transition-all group-hover:scale-105"
                        style={gradientStyle}
                    >
                        <h3 className="text-lg font-bold text-white/90 leading-tight line-clamp-4">
                            {novel.title}
                        </h3>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute right-2 top-2">
                    <span
                        className={clsx(
                            "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm",
                            novel.status === "ONGOING"
                                ? "bg-[#10B981]/90 text-white"
                                : novel.status === "COMPLETED"
                                    ? "bg-[#F59E0B]/90 text-[#0B0C10]"
                                    : "bg-muted/90 text-muted-foreground"
                        )}
                    >
                        {novel.status === "ONGOING" ? "Đang tiến hành" : novel.status === "COMPLETED" ? "Hoàn thành" : "Tạm dừng"}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex grow flex-col p-4 bg-[#1E293B]">
                <h3 className="mb-2 line-clamp-2 font-bold text-white transition-colors group-hover:text-[#FBBF24] leading-relaxed">
                    {novel.title}
                </h3>
                <p className="mb-3 text-sm font-medium text-[#9CA3AF]">
                    {novel.author}
                </p>

                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-[#9CA3AF] border-t border-[#374151]">
                    <span>{new Date(novel.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
            </div>
        </Link>
    )
}
