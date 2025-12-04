"use client";

import DOMPurify from "isomorphic-dompurify";
import { useEffect, useState } from "react";

interface ChapterContentProps {
    content: string;
    className?: string;
    fontSize?: number;
    lineHeight?: number;
}

export default function ChapterContent({
    content,
    className,
    fontSize = 18,
    lineHeight = 1.8
}: ChapterContentProps) {
    const [sanitizedContent, setSanitizedContent] = useState("");

    useEffect(() => {
        setSanitizedContent(DOMPurify.sanitize(content, { FORBID_TAGS: ['a'] }));
    }, [content]);

    return (
        <article
            className={`prose prose-lg prose-gray max-w-none leading-loose ${className} prose-headings:text-current prose-p:text-current prose-strong:text-current prose-a:text-current prose-li:text-current`}
            style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
            }}
        >
            {/* CSS to force all child elements to inherit font-size and line-height */}
            <style jsx>{`
                article :global(*) {
                    font-size: inherit !important;
                    line-height: inherit !important;
                }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </article>
    );
}
