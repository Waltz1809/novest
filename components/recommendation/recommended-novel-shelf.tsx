"use client"

import { useEffect, useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { getRecommendedNovels } from "@/actions/recommendation"
import { NovelShelf } from "@/components/novel/novel-shelf"
import Link from "next/link"

interface RecommendedNovel {
    id: number
    title: string
    slug: string
    coverImage: string | null
    nation: string | null
    genres: { id: number; name: string }[]
    volumes: { _count: { chapters: number } }[]
}

interface RecommendedNovelShelfProps {
    initialNovels?: RecommendedNovel[]
}

export function RecommendedNovelShelf({ initialNovels }: RecommendedNovelShelfProps) {
    const [novels, setNovels] = useState<RecommendedNovel[]>(initialNovels || [])
    const [loading, setLoading] = useState(!initialNovels)

    useEffect(() => {
        if (!initialNovels) {
            const fetchRecommendations = async () => {
                setLoading(true)
                const result = await getRecommendedNovels(10)
                setNovels(result.novels as RecommendedNovel[])
                setLoading(false)
            }
            fetchRecommendations()
        }
    }, [initialNovels])

    // Don't render anything if no recommendations
    if (!loading && novels.length === 0) {
        return null
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    <h2 className="text-xl font-bold text-white">Đề Xuất Cho Bạn</h2>
                </div>
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
            </div>
        )
    }

    // Transform novels to match NovelShelf expected format
    const transformedNovels = novels.map(novel => ({
        ...novel,
        _count: {
            chapters: novel.volumes?.reduce((acc, v) => acc + (v._count?.chapters || 0), 0) || 0
        }
    }))

    return (
        <div className="relative">
            {/* Gradient accent */}
            <div className="absolute inset-0 bg-linear-to-r from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />

            <NovelShelf
                title="✨ Đề Xuất Cho Bạn"
                novels={transformedNovels as any}
            />
        </div>
    )
}
