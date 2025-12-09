"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Book, ArrowRight, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CommentSection, CommentItem } from "./comment-section"
import { getChapterDiscussions } from "@/actions/interaction"
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
}

export function TabbedCommentSection({ novelId, novelSlug }: TabbedCommentSectionProps) {
    const [chapterComments, setChapterComments] = useState<ChapterComment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchChapterDiscussions = async () => {
            setLoading(true)
            const result = await getChapterDiscussions(novelId, 10)
            setChapterComments(result.comments as ChapterComment[])
            setLoading(false)
        }
        fetchChapterDiscussions()
    }, [novelId])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-xl font-bold text-gray-200">
                <MessageSquare className="h-6 w-6 text-[#F59E0B]" />
                <h3>Bình luận & Thảo luận</h3>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-[#0B0C10] border border-[#374151] p-1">
                    <TabsTrigger
                        value="general"
                        className="data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#0B0C10] text-gray-400"
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Bình luận
                    </TabsTrigger>
                    <TabsTrigger
                        value="chapter"
                        className="data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#0B0C10] text-gray-400"
                    >
                        <Book className="h-4 w-4 mr-2" />
                        Thảo luận chương
                    </TabsTrigger>
                </TabsList>

                {/* General Comments Tab */}
                <TabsContent value="general" className="mt-6">
                    <CommentSection novelId={novelId} />
                </TabsContent>

                {/* Chapter Discussions Tab */}
                <TabsContent value="chapter" className="mt-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-[#F59E0B]" />
                        </div>
                    ) : chapterComments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
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
        <div className="bg-[#1E293B]/50 rounded-lg p-4 border border-white/5 hover:border-amber-500/20 transition-colors">
            {/* Chapter badge */}
            <Link
                href={`/truyen/${novelSlug}/${chapterSlug}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500 hover:text-amber-400 mb-3 transition-colors"
            >
                <Book className="h-3 w-3" />
                Chương {Math.floor(chapterNumber)}: {chapterTitle.length > 40 ? chapterTitle.slice(0, 40) + "..." : chapterTitle}
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
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-gray-400">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href={`/u/${comment.user.username || comment.user.id}`}
                            className="text-sm font-medium text-white hover:text-amber-500 transition-colors"
                        >
                            {displayName}
                        </Link>
                        <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-3">{comment.content}</p>

                    <Link
                        href={`/truyen/${novelSlug}/${chapterSlug}`}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-amber-500 mt-2 transition-colors"
                    >
                        Xem tại chương
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
