"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Menu, X, Clock } from "lucide-react";
import UserMenu from "@/components/auth/user-menu";

interface DashboardSidebarProps {
    userRole: string;
    user: {
        name: string;
        email: string;
        image: string | null;
        role: string;
    };
    balance: number;
    isCollapsed: boolean;
    isMobile: boolean;
    isMobileOpen: boolean;
    onToggle: () => void;
    onMobileClose: () => void;
}

export default function DashboardSidebar({
    userRole,
    user,
    balance,
    isCollapsed,
    isMobile,
    isMobileOpen,
    onToggle,
    onMobileClose,
}: DashboardSidebarProps) {
    return (
        <>
            {/* Mobile Toggle Button (Fixed) - Only show when sidebar is hidden (if we had a hidden state, but now it's always visible as icons) */}
            {/* Actually, if it's icon-only, we don't need a toggle button to "open" it, unless we want to expand it to full width? 
                The user said "just make the sidebar only show icon in mobile mode". 
                This implies it's ALWAYS there as a thin strip, or it toggles between Hidden and Icon-Only?
                "so it dont take too much place".
                Let's assume: Mobile Default = Icon Only (w-20). 
                If they click an icon, it navigates.
                Do they need to expand it to see labels? "make it responsive so dont loss the label in desktop mode".
                So Desktop = Full/Collapsed. Mobile = Icon Only (maybe expandable to Full?).
                Let's make Mobile behave like Desktop Collapsed state by default.
            */}

            <aside
                className={`
                    bg-[#1E293B] border-r border-[#34D399]/20 flex flex-col 
                    transition-all duration-300 z-50
                    fixed top-16 bottom-0 left-0
                    ${isMobile
                        ? "w-16" // Mobile always icon-only (w-16)
                        : (isCollapsed ? "w-16" : "w-64") // Desktop follows collapsed state
                    }
                `}
            >
                {/* Desktop Toggle Button */}
                {!isMobile && (
                    <button
                        onClick={onToggle}
                        className={`
                            absolute -right-3 top-6 w-6 h-6 bg-[#F59E0B] rounded-full flex items-center justify-center text-[#0B0C10] hover:bg-[#FBBF24] transition-colors shadow-lg glow-amber z-60 cursor-pointer
                        `}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <Menu className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </button>
                )}

                {/* Logo Removed as per request */}

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar flex flex-col items-center pt-6">
                    <Link
                        href="/studio"
                        className={`flex items-center ${isCollapsed || isMobile ? "justify-center w-10 h-10 p-0" : "gap-3 px-4 py-3 w-full"
                            } text-[#9CA3AF] hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group relative`}
                        title="Thống kê"
                    >
                        <LayoutDashboard className="w-5 h-5 shrink-0" />
                        {(!isCollapsed && !isMobile) && <span>Thống kê</span>}
                    </Link>
                    <Link
                        href="/studio/novels"
                        className={`flex items-center ${isCollapsed || isMobile ? "justify-center w-10 h-10 p-0" : "gap-3 px-4 py-3 w-full"
                            } text-[#9CA3AF] hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group relative`}
                        title="Quản lý Truyện"
                    >
                        <BookOpen className="w-5 h-5 shrink-0" />
                        {(!isCollapsed && !isMobile) && <span>Quản lý Truyện</span>}
                    </Link>
                    <Link
                        href="/studio/novels/pending"
                        className={`flex items-center ${isCollapsed || isMobile ? "justify-center w-10 h-10 p-0" : "gap-3 px-4 py-3 w-full"
                            } text-amber-400 hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group relative`}
                        title="Chờ duyệt"
                    >
                        <Clock className="w-5 h-5 shrink-0" />
                        {(!isCollapsed && !isMobile) && <span>Chờ duyệt</span>}
                    </Link>
                </nav>
            </aside>
        </>
    );
}
