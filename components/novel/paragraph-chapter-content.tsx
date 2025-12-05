"use client"

import DOMPurify from "isomorphic-dompurify"
import { useEffect, useState, useMemo } from "react"
import { MessageCircle } from "lucide-react"
import { ReadingTheme, READING_THEMES } from "@/lib/reading-themes"

interface ParagraphChapterContentProps {
    content: string
    className?: string
    fontSize?: number
    lineHeight?: number
    paragraphCommentCounts?: Record<number, number>
    onParagraphClick?: (paragraphId: number) => void
    themeId?: string
}

export function ParagraphChapterContent({
    content,
    className,
    fontSize = 18,
    lineHeight = 1.8,
    paragraphCommentCounts = {},
    onParagraphClick,
    themeId = "light",
}: ParagraphChapterContentProps) {
    const [sanitizedContent, setSanitizedContent] = useState("")
    const [mounted, setMounted] = useState(false)
    const theme: ReadingTheme = READING_THEMES[themeId] || READING_THEMES["light"]
    const isDark = ["dark", "night", "onyx", "dusk"].includes(theme.id)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        setSanitizedContent(DOMPurify.sanitize(content, { FORBID_TAGS: ['a'] }))
    }, [content])

    // Split content into paragraphs - only on client side
    const paragraphs = useMemo(() => {
        if (!mounted || !sanitizedContent) return []

        // Parse HTML and extract text blocks
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = sanitizedContent

        const blocks: string[] = []

        // Walk through child nodes
        const walk = (node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement
                const tag = el.tagName.toLowerCase()

                // Block-level elements
                if (["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre"].includes(tag)) {
                    const text = el.innerHTML.trim()
                    if (text) {
                        blocks.push(text)
                    }
                } else if (tag === "br") {
                    // Skip br tags
                } else {
                    // For inline elements, recurse
                    el.childNodes.forEach(walk)
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim()
                if (text) {
                    // Split by double newlines or single newlines
                    const parts = text.split(/\n\n+|\n/).filter(p => p.trim())
                    parts.forEach(p => blocks.push(p))
                }
            }
        }

        // If no block elements, split by newlines
        if (tempDiv.children.length === 0 ||
            (tempDiv.children.length === 1 && tempDiv.children[0].tagName.toLowerCase() === "div")) {
            const text = tempDiv.textContent || ""
            return text.split(/\n+/).filter(p => p.trim())
        }

        tempDiv.childNodes.forEach(walk)

        return blocks.length > 0 ? blocks : [sanitizedContent]
    }, [sanitizedContent, mounted])

    const handleParagraphClick = (index: number) => {
        if (onParagraphClick) {
            onParagraphClick(index)
        }
    }

    // Server-side render fallback - simple HTML
    if (!mounted) {
        return (
            <article
                className={`prose prose-lg prose-gray max-w-none leading-loose ${className} prose-headings:text-current prose-p:text-current prose-strong:text-current prose-a:text-current prose-li:text-current`}
                style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                }}
            >
                <div dangerouslySetInnerHTML={{ __html: sanitizedContent || content }} />
            </article>
        )
    }

    return (
        <article
            className={`prose prose-lg prose-gray max-w-none leading-loose ${className} prose-headings:text-current prose-p:text-current prose-strong:text-current prose-a:text-current prose-li:text-current`}
            style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
            }}
        >
            <div className="space-y-6">
                {paragraphs.map((paragraph, index) => {
                    const commentCount = paragraphCommentCounts[index] || 0
                    const hasComments = commentCount > 0

                    return (
                        <div
                            key={index}
                            data-pid={index}
                            className="group relative"
                        >
                            {/* Paragraph Text */}
                            <p
                                className="cursor-pointer transition-colors duration-200 rounded-md px-1 -mx-1"
                                onClick={() => handleParagraphClick(index)}
                                style={{
                                    fontSize: "inherit",
                                    lineHeight: "inherit",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = isDark
                                        ? "rgba(255,255,255,0.03)"
                                        : "rgba(0,0,0,0.02)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent"
                                }}
                                dangerouslySetInnerHTML={{ __html: paragraph }}
                            />

                            {/* Comment Indicator */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleParagraphClick(index)
                                }}
                                className={`
                                    absolute -right-12 top-0 
                                    flex items-center gap-1 
                                    px-2 py-1 rounded-full
                                    text-xs font-medium
                                    transition-all duration-200
                                    ${hasComments
                                        ? "opacity-100"
                                        : "opacity-0 group-hover:opacity-60"
                                    }
                                `}
                                style={{
                                    backgroundColor: hasComments
                                        ? isDark ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.15)"
                                        : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                                    color: hasComments ? "#f59e0b" : theme.ui.text,
                                }}
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                {hasComments && (
                                    <span>{commentCount}</span>
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>
        </article>
    )
}
