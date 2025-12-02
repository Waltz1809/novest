"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Menu, X } from "lucide-react";
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
            {/* Mobile Toggle Button (Fixed) */}
            <button
                onClick={onToggle}
                className={`lg:hidden fixed left-4 top-20 z-30 p-2 bg-[#1E293B] text-[#F59E0B] rounded-lg border border-[#34D399]/20 shadow-lg ${isMobileOpen ? 'hidden' : 'block'}`}
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Backdrop */}
            {isMobile && isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={onMobileClose}
                />
            )}

            <aside
                className={`
                    bg-[#1E293B] border-r border-[#34D399]/20 flex flex-col 
                    transition-all duration-300 z-40
                    ${isMobile
                        ? `fixed h-full top-0 ${isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}`
                        : `fixed top-16 bottom-0 left-0 ${isCollapsed ? "w-20" : "w-64"}`
                    }
                `}
            >
                {/* Toggle Button (Desktop & Mobile Close) */}
                <button
                    onClick={onToggle}
                    className={`
                        absolute -right-3 top-6 w-6 h-6 bg-[#F59E0B] rounded-full flex items-center justify-center text-[#0B0C10] hover:bg-[#FBBF24] transition-colors shadow-lg glow-amber z-50
                        ${isMobile ? "right-4 top-4" : ""}
                    `}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isMobile ? <X className="w-3 h-3" /> : (isCollapsed ? <Menu className="w-3 h-3" /> : <X className="w-3 h-3" />)}
                </button>

                {/* Logo */}
                <div className={`p-6 ${isCollapsed && !isMobile ? "px-4" : ""}`}>
                    <Link href="/" className="flex items-center gap-2 justify-center">
                        <div className="bg-[#F59E0B] p-1.5 rounded-lg glow-amber">
                            <BookOpen className="w-6 h-6 text-[#0B0C10]" />
                        </div>
                        {(!isCollapsed || isMobile) && (
                            <span className="text-xl font-bold text-white tracking-tight">
                                Novest Admin
                            </span>
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <Link
                        href="/dashboard"
                        className={`flex items-center ${isCollapsed && !isMobile ? "justify-center px-2" : "gap-3 px-4"
                            } py-3 text-[#9CA3AF] hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group`}
                        title={isCollapsed ? "Thống kê" : ""}
                        onClick={() => isMobile && onMobileClose()}
                    >
                        <LayoutDashboard className="w-5 h-5 shrink-0" />
                        {(!isCollapsed || isMobile) && <span>Thống kê</span>}
                    </Link>
                    <Link
                        href="/dashboard/novels"
                        className={`flex items-center ${isCollapsed && !isMobile ? "justify-center px-2" : "gap-3 px-4"
                            } py-3 text-[#9CA3AF] hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group`}
                        title={isCollapsed ? "Quản lý Truyện" : ""}
                        onClick={() => isMobile && onMobileClose()}
                    >
                        <BookOpen className="w-5 h-5 shrink-0" />
                        {(!isCollapsed || isMobile) && <span>Quản lý Truyện</span>}
                    </Link>
                </nav>
            </aside>
        </>
    );
}
