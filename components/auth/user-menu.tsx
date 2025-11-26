"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, Book, ChevronDown, LayoutDashboard, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface UserMenuProps {
    user: {
        name?: string | null;
        image?: string | null;
        role: string;
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
                        className="rounded-full "
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User className="w-4 h-4" />
                    </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                    {user.name}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg  py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                        <p className="text-sm font-medium text-gray-900">Tài khoản của tôi</p>
                    </div>

                    {/* Dashboard Link - Only for ADMIN and TRANSLATOR */}
                    {isAdminOrTranslator && (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </Link>
                    )}

                    {/* Settings Link - For all users */}
                    <Link
                        href="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <Settings className="w-4 h-4" />
                        <span>Cài đặt tài khoản</span>
                    </Link>

                    {/* Library Link */}
                    <Link
                        href="/tu-truyen"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <Book className="w-4 h-4" />
                        <span>Tủ truyện</span>
                    </Link>

                    {/* Sign Out */}
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors mt-2 border-t border-gray-100 pt-2"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            )}
        </div>
    );
}
