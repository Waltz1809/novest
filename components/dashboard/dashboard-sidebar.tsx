"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, PenTool, Menu, X } from "lucide-react";
import UserButton from "@/components/auth/user-button";

interface DashboardSidebarProps {
    userRole: string;
}

export default function DashboardSidebar({ userRole }: DashboardSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Load collapsed state from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved) {
            setIsCollapsed(JSON.parse(saved));
        }
    }, []);

    // Save collapsed state to localStorage
    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
    };

    return (
        <aside
            className={`${isCollapsed ? "w-20" : "w-64"
                } bg-[#1E293B] border-r border-[#34D399]/20 flex flex-col fixed h-full top-16 transition-all duration-300 z-40`}
        >
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-6 w-6 h-6 bg-[#F59E0B] rounded-full flex items-center justify-center text-[#0B0C10] hover:bg-[#FBBF24] transition-colors shadow-lg glow-amber z-50"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <Menu className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </button>

            {/* Logo */}
            <div className={`p-6 ${isCollapsed ? "px-4" : ""}`}>
                <Link href="/" className="flex items-center gap-2 justify-center">
                    <div className="bg-[#F59E0B] p-1.5 rounded-lg glow-amber">
                        <BookOpen className="w-6 h-6 text-[#0B0C10]" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold text-white tracking-tight">
                            Novest Admin
                        </span>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                <Link
                    href="/dashboard"
                    className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3 px-4"
                        } py-3 text-[#9CA3AF] hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group`}
                    title={isCollapsed ? "Thống kê" : ""}
                >
                    <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>Thống kê</span>}
                </Link>
                <Link
                    href="/dashboard/novels"
                    className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3 px-4"
                        } py-3 text-[#9CA3AF] hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group`}
                    title={isCollapsed ? "Quản lý Truyện" : ""}
                >
                    <BookOpen className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>Quản lý Truyện</span>}
                </Link>
                <Link
                    href="/dashboard/write"
                    className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3 px-4"
                        } py-3 text-[#9CA3AF] hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group`}
                    title={isCollapsed ? "Viết chương mới" : ""}
                >
                    <PenTool className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>Viết chương mới</span>}
                </Link>
            </nav>

            {/* User Button */}
            <div className={`p-4 ${isCollapsed ? "flex justify-center" : ""}`}>
                <div className={`flex items-center ${isCollapsed ? "" : "gap-3 px-4"} py-3`}>
                    <UserButton />
                </div>
            </div>
        </aside>
    );
}
