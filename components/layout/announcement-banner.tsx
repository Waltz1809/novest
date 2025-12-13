"use client";

import { useEffect, useState } from "react";
import { X, Megaphone, BellOff } from "lucide-react";
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
    const [isClosing, setIsClosing] = useState(false);

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
                        // Small delay to trigger animation
                        setTimeout(() => setIsVisible(true), 100);
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

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
        }, 200);
    };

    const handleDismissForToday = () => {
        if (announcement) {
            const today = new Date().toISOString().split('T')[0];
            const dismissKey = `announcement_${announcement.id}_${today}`;
            localStorage.setItem(dismissKey, "true");
        }
        handleClose();
    };

    if (isLoading || !isVisible || !announcement) {
        return null;
    }

    return (
        <div
            className={`fixed inset-0 z-100 flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-lg bg-white 
                    backdrop-blur-xl rounded-2xl border border-amber-200 shadow-2xl
                    transform transition-all duration-300 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-100">
                            <Megaphone className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Thông báo
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                        title="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
                    {announcement.title && (
                        <h3 className="text-base font-semibold text-amber-600 mb-3">
                            {announcement.title}
                        </h3>
                    )}
                    <div
                        className="prose prose-sm max-w-none text-muted-foreground leading-relaxed
                            prose-p:my-2 prose-p:text-sm
                            prose-strong:text-amber-600
                            prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
                            prose-img:rounded-lg prose-img:max-h-64 prose-img:w-auto prose-img:mx-auto prose-img:my-3
                            prose-ul:my-2 prose-li:my-0.5"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(announcement.content)
                        }}
                    />
                </div>

                {/* Footer with actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handleDismissForToday}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl 
                            text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                    >
                        <BellOff className="w-4 h-4" />
                        <span>Không hiển thị lại trong ngày</span>
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={handleClose}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 
                            text-sm font-medium text-white transition-colors"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
}
