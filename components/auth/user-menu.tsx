"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, Book, LayoutDashboard, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRealUsername } from "@/hooks/use-real-username";

interface UserMenuProps {
    user: {
        name?: string | null;
        image?: string | null;
        role: string;
        username?: string | null;
    };
}

export default function UserMenu({ user }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fetch real username from DB to bypass stale JWT session
    const { username: realUsername } = useRealUsername(user.username);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isAdminOrTranslator = user.role === "ADMIN" || user.role === "TRANSLATOR";

    // Use real username from DB, fallback to session username
    const displayUsername = realUsername || user.username;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
                {user.image ? (
                    <Image
                        src={user.image}
                        alt={user.name || "User Avatar"}
                        width={32}
                        height={32}
                        className="rounded-full border border-gray-200"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-amber-500 border border-amber-200">
                        <User className="w-4 h-4" />
                    </div>
                )}
                <span className="text-sm font-medium text-foreground hidden sm:inline-block">
                    {user.name}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100 mb-2">
                        <p className="text-sm font-medium text-foreground">Tài khoản của tôi</p>
                    </div>

                    {/* Profile Link */}
                    <Link
                        href={`/u/${displayUsername}`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 hover:text-amber-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <User className="w-4 h-4" />
                        <span>Trang cá nhân</span>
                    </Link>

                    {/* Settings Link - For all users */}
                    <Link
                        href={`/u/${displayUsername}/settings`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 hover:text-amber-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <Settings className="w-4 h-4" />
                        <span>Cài đặt tài khoản</span>
                    </Link>

                    {/* Creator Studio - Available to all users */}
                    <Link
                        href="/studio"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-gray-50 hover:text-amber-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Creator Studio</span>
                    </Link>



                    {/* Admin Dashboard Link - Only for ADMIN or MODERATOR */}
                    {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Settings className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                        </Link>
                    )}

                    {/* Sign Out */}
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors mt-2 border-t border-gray-100 pt-2"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            )}
        </div>
    );
}
