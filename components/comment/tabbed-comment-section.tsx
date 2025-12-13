"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Book, ArrowRight, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CommentSection, CommentItem } from "./comment-section"
import { commentService } from "@/services"
import Link from "next/link"
import Image from "next/image"
import { clsx } from "clsx"

interface ChapterComment {
    id: number
    content: string
    createdAt: Date
    updatedAt?: Date
    user: {
        id: string
        name: string | null
        nickname: string | null
        username: string | null
        image: string | null
    }
    chapter: {
        id: number
        title: string
        slug: string
        order: number
        volume: {
            novelId: number
            novel: {
                slug: string
            }
        }
    } | null
    score: number
    userVote: "UPVOTE" | "DOWNVOTE" | null
}

interface TabbedCommentSectionProps {
    novelId: number
    novelSlug: string
    uploaderId?: string
}

export function TabbedCommentSection({ novelId, novelSlug, uploaderId }: TabbedCommentSectionProps) {
    const [chapterComments, setChapterComments] = useState<ChapterComment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchChapterDiscussions = async () => {
            setLoading(true)
            const result = await commentService.getChapterDiscussions(novelId, 10)
            if (result.success && result.data) {
                setChapterComments(result.data.items as unknown as ChapterComment[])
            }
            setLoading(false)
        }
        fetchChapterDiscussions()
    }, [novelId])

    return (
        <div className="space-y-4">

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-gray-50 border border-gray-200 p-1">
                    <TabsTrigger
                        value="general"
                        className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-muted-foreground"
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Bình luận
                    </TabsTrigger>
                    <TabsTrigger
                        value="chapter"
                        className="data-[state=active]:bg-amber-500 data-[state=active]:text-white text-muted-foreground"
                    >
                        <Book className="h-4 w-4 mr-2" />
                        Thảo luận chương
                    </TabsTrigger>
                </TabsList>

                {/* General Comments Tab */}
                <TabsContent value="general" className="mt-6">
                    <CommentSection novelId={novelId} uploaderId={uploaderId} />
                </TabsContent>

                {/* Chapter Discussions Tab */}
                <TabsContent value="chapter" className="mt-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                        </div>
                    ) : chapterComments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Book className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>Chưa có thảo luận chương nào.</p>
                            <p className="text-sm mt-1">Đọc truyện và bình luận về các chương yêu thích!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {chapterComments.map((comment) => (
                                <ChapterDiscussionItem
                                    key={comment.id}
                                    comment={comment}
                                    novelSlug={novelSlug}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ChapterDiscussionItem({ comment, novelSlug }: { comment: ChapterComment; novelSlug: string }) {
    const displayName = comment.user.nickname || comment.user.name || "Ẩn danh"
    const chapterNumber = comment.chapter?.order || 1
    const chapterTitle = comment.chapter?.title || "Chương không xác định"
    const chapterSlug = comment.chapter?.slug || ""

    return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-amber-300 transition-colors">
            {/* Chapter badge */}
            <Link
                href={`/truyen/${novelSlug}/${chapterSlug}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 mb-3 transition-colors"
            >
                <Book className="h-3 w-3" />
                {chapterTitle.length > 50 ? chapterTitle.slice(0, 50) + "..." : chapterTitle}
                <ArrowRight className="h-3 w-3" />
            </Link>

            {/* Comment content */}
            <div className="flex gap-3">
                <Link href={`/u/${comment.user.username || comment.user.id}`} className="shrink-0">
                    {comment.user.image ? (
                        <Image
                            src={comment.user.image}
                            alt={displayName}
                            width={32}
                            height={32}
                            className="rounded-full object-cover w-8 h-8"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-primary/60 flex items-center justify-center text-xs text-gray-500">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href={`/u/${comment.user.username || comment.user.id}`}
                            className="text-sm font-medium text-foreground hover:text-amber-600 transition-colors"
                        >
                            {displayName}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{comment.content}</p>

                    <Link
                        href={`/truyen/${novelSlug}/${chapterSlug}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-amber-600 mt-2 transition-colors"
                    >
                        Xem tại chương
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
