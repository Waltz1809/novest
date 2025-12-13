"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import UserMenu from "@/components/auth/user-menu";
import { NotificationBell } from "@/components/notification/notification-bell";
import { LibraryNotificationBell } from "@/components/notification/library-notification-bell";

interface StudioHeaderProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role: string;
        nickname?: string | null;
        username?: string | null;
    };
}

export default function StudioHeader({ user }: StudioHeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-200">
            <div className="container mx-auto py-3 md:py-4 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors shrink-0"
                >
                    <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                        <BookOpen size={24} />
                    </div>
                    <span className="font-display tracking-tight hidden sm:block">
                        Novest
                    </span>
                </Link>

                {/* Right Tools - Simplified: only noti, library, user */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <LibraryNotificationBell />
                    <NotificationBell />
                    <UserMenu user={user} />
                </div>
            </div>
        </header>
    );
}
