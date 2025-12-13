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

// Default cover image path
const DEFAULT_COVER = "/images/default-cover.png";

export function NovelCard({ novel }: NovelCardProps) {
    // Use cover image or default cover
    const coverSrc = novel.coverImage && (novel.coverImage.startsWith("http") || novel.coverImage.startsWith("/"))
        ? novel.coverImage
        : DEFAULT_COVER;

    return (
        <Link
            href={`/truyen/${novel.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-lg bg-white border border-gray-200 transition-all duration-300 hover:border-primary/60 hover:scale-[1.02] shadow-sm"
        >
            {/* Cover Image Area */}
            <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
                <Image
                    src={coverSrc}
                    alt={novel.title}
                    fill
                    className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

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
            <div className="flex grow flex-col p-4 bg-white">
                <h3 className="mb-2 line-clamp-2 font-bold text-foreground transition-colors group-hover:text-primary leading-relaxed">
                    {novel.title}
                </h3>
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                    {novel.author}
                </p>

                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground border-t border-gray-200">
                    <span>{new Date(novel.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
            </div>
        </Link>
    )
}
