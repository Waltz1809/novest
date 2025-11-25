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
        setSanitizedContent(DOMPurify.sanitize(content));
    }, [content]);

    return (
        <article className={`prose prose-lg prose-gray max-w-none leading-loose text-foreground dark:prose-invert ${className}`}>
            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </article>
    );
}
