"use client";

import { MessageCircle } from "lucide-react";

interface Comment {
    id: number;
    user: string;
    text: string;
    time: string;
    avatar?: string;
}

interface CommentActivityProps {
    comments?: Comment[];
    className?: string;
}

// Mock data - used as fallback if no comments provided
const defaultComments: Comment[] = [
    {
        id: 1,
        user: "User123",
        text: "Great chapter!",
        time: "10m ago",
    },
    {
        id: 2,
        user: "User458",
        text: "When is the next one?",
        time: "1h ago",
    },
    {
        id: 3,
        user: "User123",
        text: "Great chapter!",
        time: "38m ago",
    },
];

export default function CommentActivity({
    comments,
    className = "",
}: CommentActivityProps) {
    // Use provided comments or fall back to default
    const displayComments = comments && comments.length > 0 ? comments : defaultComments;
    return (
        <div
            className={`relative bg-[#1E293B] rounded-2xl p-6 border border-[#34D399]/20 hover:border-[#34D399]/40 transition-all duration-300 ${className}`}
        >
            {/* Badge Number */}
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[#0B0C10] border border-[#F59E0B]/30 flex items-center justify-center">
                <span className="text-[#F59E0B] font-bold text-sm">3</span>
            </div>

            {/* Title */}
            <h3 className="text-[#9CA3AF] text-sm font-medium uppercase tracking-wide mb-4">
                Bình luận mới
            </h3>

            {/* Comments List */}
            <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar">
                {displayComments.map((comment) => (
                    <div
                        key={comment.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-[#0B0C10]/50 hover:bg-[#0B0C10] transition-colors"
                    >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#34D399] flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-4 h-4 text-[#0B0C10]" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-sm font-medium text-white truncate">
                                    {comment.user}
                                </span>
                                <span className="text-xs text-[#9CA3AF] flex-shrink-0">
                                    {comment.time}
                                </span>
                            </div>
                            <p className="text-sm text-[#9CA3AF] line-clamp-1">
                                {comment.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
