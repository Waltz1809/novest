import Link from "next/link"
import Image from "next/image"
import { Book } from "lucide-react"
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

export function NovelCard({ novel }: NovelCardProps) {
    return (
        <Link
            href={`/truyen/${novel.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md"
        >
            {/* Cover Image Area */}
            <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                {novel.coverImage && (novel.coverImage.startsWith("http") || novel.coverImage.startsWith("/")) ? (
                    <Image
                        src={novel.coverImage}
                        alt={novel.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10">
                        <Book className="mb-2 h-12 w-12 text-muted-foreground/50 transition-colors group-hover:text-primary/50" />
                        <span className="text-xs font-medium text-muted-foreground/70">
                            No Cover
                        </span>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute right-2 top-2">
                    <span
                        className={clsx(
                            "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                            novel.status === "ONGOING"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : novel.status === "COMPLETED"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        )}
                    >
                        {novel.status}
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-grow flex-col p-4">
                <h3 className="mb-1 line-clamp-2 font-bold text-card-foreground transition-colors group-hover:text-primary">
                    {novel.title}
                </h3>
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                    {novel.author}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>{new Date(novel.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
            </div>
        </Link>
    )
}
