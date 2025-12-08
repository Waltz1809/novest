"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, Book, LayoutDashboard, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

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
                        className="rounded-full border border-[#34D399]/30"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1F2937] flex items-center justify-center text-[#F59E0B] border border-[#F59E0B]/30">
                        <User className="w-4 h-4" />
                    </div>
                )}
                <span className="text-sm font-medium text-gray-200 hidden sm:inline-block">
                    {user.name}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0B0C10] rounded-xl shadow-2xl border border-[#1F2937] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                    <div className="px-4 py-3 border-b border-[#1F2937] mb-2">
                        <p className="text-sm font-medium text-gray-200">Tài khoản của tôi</p>
                    </div>

                    {/* Profile Link */}
                    <Link
                        href={`/u/${user.username}`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1F2937] hover:text-[#F59E0B] transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <User className="w-4 h-4" />
                        <span>Trang cá nhân</span>
                    </Link>

                    {/* Settings Link - For all users */}
                    <Link
                        href={`/u/${user.username}/settings`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1F2937] hover:text-[#F59E0B] transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <Settings className="w-4 h-4" />
                        <span>Cài đặt tài khoản</span>
                    </Link>

                    {/* Creator Studio - Available to all users */}
                    <Link
                        href="/studio"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1F2937] hover:text-[#F59E0B] transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Creator Studio</span>
                    </Link>

                    {/* Library Link */}
                    <Link
                        href="/tu-truyen"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#1F2937] hover:text-[#F59E0B] transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <Book className="w-4 h-4" />
                        <span>Tủ truyện</span>
                    </Link>

                    {/* Admin Dashboard Link - Only for ADMIN or MODERATOR */}
                    {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#34D399] hover:bg-[#1F2937] hover:text-[#10B981] transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <Settings className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                        </Link>
                    )}

                    {/* Sign Out */}
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors mt-2 border-t border-[#1F2937] pt-2"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            )}
        </div>
    );
}
