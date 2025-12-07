"use client";

import { useEffect, useState } from "react";
import { X, Info } from "lucide-react";
import { getActiveAnnouncement } from "@/actions/announcements";
import DOMPurify from "isomorphic-dompurify";

interface Announcement {
    id: string;
    title: string;
    content: string;
}

export function AnnouncementBanner() {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function checkAnnouncement() {
            try {
                const result = await getActiveAnnouncement();
                if (result.announcement) {
                    const ann = result.announcement;

                    // Check if already dismissed today
                    const today = new Date().toISOString().split('T')[0];
                    const dismissKey = `announcement_${ann.id}_${today}`;
                    const dismissed = localStorage.getItem(dismissKey);

                    if (!dismissed) {
                        setAnnouncement(ann);
                        setIsVisible(true);
                    }
                }
            } catch (error) {
                console.error("Error fetching announcement:", error);
            } finally {
                setIsLoading(false);
            }
        }

        checkAnnouncement();
    }, []);

    const handleDismiss = () => {
        if (announcement) {
            const today = new Date().toISOString().split('T')[0];
            const dismissKey = `announcement_${announcement.id}_${today}`;
            localStorage.setItem(dismissKey, "true");
        }
        setIsVisible(false);
    };

    if (isLoading || !isVisible || !announcement) {
        return null;
    }

    return (
        <div className="bg-linear-to-r from-[#1E293B] to-[#0F172A] border-b border-[#F59E0B]/20">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                        <div className="p-1.5 rounded-full bg-[#F59E0B]/20">
                            <Info className="w-4 h-4 text-[#F59E0B]" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div
                            className="prose prose-sm prose-invert max-w-none text-gray-200 leading-relaxed
                                prose-p:my-1 prose-p:text-sm
                                prose-strong:text-[#F59E0B]
                                prose-a:text-[#34D399] prose-a:no-underline hover:prose-a:underline
                                prose-img:rounded-lg prose-img:max-h-32 prose-img:w-auto prose-img:inline-block prose-img:my-2"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(announcement.content)
                            }}
                        />
                    </div>

                    {/* Dismiss Button */}
                    <button
                        onClick={handleDismiss}
                        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Đóng thông báo"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
