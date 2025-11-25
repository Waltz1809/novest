"use client";

import DOMPurify from "isomorphic-dompurify";
import { useEffect, useState } from "react";

interface ChapterContentProps {
    content: string;
    className?: string;
}

export default function ChapterContent({ content, className }: ChapterContentProps) {
    const [sanitizedContent, setSanitizedContent] = useState("");

    useEffect(() => {
        setSanitizedContent(DOMPurify.sanitize(content, { FORBID_TAGS: ['a'] }));
    }, [content]);

    return (
        <article className={`prose prose-lg prose-gray max-w-none leading-loose ${className} prose-headings:text-current prose-p:text-current prose-strong:text-current prose-a:text-current prose-li:text-current`}>
            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </article>
    );
}
