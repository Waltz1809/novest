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
}

export default function DashboardSidebar({ userRole, user, balance }: DashboardSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Mobile state
    const [isMobile, setIsMobile] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Handle resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) {
                setIsOpen(true); // Always open on desktop by default (or respect collapsed)
            } else {
                setIsOpen(false); // Closed by default on mobile
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Save collapsed state to localStorage (Desktop only)
    const toggleSidebar = () => {
        if (isMobile) {
            setIsOpen(!isOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
        }
    };

    return (
        <>
            {/* Mobile Toggle Button (Fixed) */}
            <button
                onClick={() => setIsOpen(true)}
                className={`lg:hidden fixed left-4 top-20 z-30 p-2 bg-[#1E293B] text-[#F59E0B] rounded-lg border border-[#34D399]/20 shadow-lg ${isOpen ? 'hidden' : 'block'}`}
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Backdrop */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`
                    bg-[#1E293B] border-r border-[#34D399]/20 flex flex-col 
                    fixed h-full top-0 lg:top-16 transition-all duration-300 z-50
                    ${isMobile
                        ? (isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64")
                        : (isCollapsed ? "w-20 translate-x-0" : "w-64 translate-x-0")
                    }
                `}
            >
                {/* Toggle Button (Desktop & Mobile Close) */}
                <button
                    onClick={toggleSidebar}
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
                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/dashboard"
                        className={`flex items-center ${isCollapsed && !isMobile ? "justify-center px-2" : "gap-3 px-4"
                            } py-3 text-[#9CA3AF] hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group`}
                        title={isCollapsed ? "Thống kê" : ""}
                        onClick={() => isMobile && setIsOpen(false)}
                    >
                        <LayoutDashboard className="w-5 h-5 shrink-0" />
                        {(!isCollapsed || isMobile) && <span>Thống kê</span>}
                    </Link>
                    <Link
                        href="/dashboard/novels"
                        className={`flex items-center ${isCollapsed && !isMobile ? "justify-center px-2" : "gap-3 px-4"
                            } py-3 text-[#9CA3AF] hover:bg-[#0B0C10] hover:text-[#FBBF24] rounded-lg transition-colors font-medium group`}
                        title={isCollapsed ? "Quản lý Truyện" : ""}
                        onClick={() => isMobile && setIsOpen(false)}
                    >
                        <BookOpen className="w-5 h-5 shrink-0" />
                        {(!isCollapsed || isMobile) && <span>Quản lý Truyện</span>}
                    </Link>
                </nav>

                {/* User Menu */}
                <div className={`p-4 ${isCollapsed && !isMobile ? "flex justify-center" : ""}`}>
                    <div className={`flex items-center ${isCollapsed && !isMobile ? "" : "gap-3 px-4"} py-3`}>
                        <UserMenu user={user} balance={balance} />
                    </div>
                </div>
            </aside>
        </>
    );
}
