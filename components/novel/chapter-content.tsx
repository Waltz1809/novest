"use client";

import DOMPurify from "isomorphic-dompurify";
import { useEffect, useState } from "react";

interface ChapterContentProps {
    content: string;
}

export default function ChapterContent({ content }: ChapterContentProps) {
    const [sanitizedContent, setSanitizedContent] = useState("");

    useEffect(() => {
        setSanitizedContent(DOMPurify.sanitize(content));
    }, [content]);

    return (
        <article className="prose prose-lg prose-gray max-w-none font-serif text-xl leading-loose text-gray-800">
            <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
        </article>
    );
}
