"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    BookOpen,
    Tag,
    Ticket,
    Megaphone,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const sidebarItems = [
    {
        title: "Overview",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Users",
        href: "/admin/users",
        icon: Users,
    },
    {
        title: "Comments",
        href: "/admin/comments",
        icon: MessageSquare,
    },
    {
        title: "Novels",
        href: "/admin/novels",
        icon: BookOpen,
    },
    {
        title: "Thể loại",
        href: "/admin/genres",
        icon: Tag,
    },
    {
        title: "Tickets",
        href: "/admin/tickets",
        icon: Ticket,
    },
    {
        title: "Thông báo",
        href: "/admin/announcements",
        icon: Megaphone,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen border-r border-white/5 bg-[#0B0C10] text-gray-300 transition-all duration-300",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className={cn(
                    "flex h-16 items-center border-b border-white/5",
                    isCollapsed ? "justify-center" : "justify-between px-6"
                )}>
                    {!isCollapsed && (
                        <Link href="/" className="flex items-center gap-2 font-bold text-white font-family-name:var(--font-be-vietnam-pro)">
                            <span className="text-amber-500">Novest</span>
                            <span className="text-xs font-normal text-gray-500">Admin</span>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-gray-400 hover:text-white hover:bg-white/5"
                    >
                        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center rounded-lg transition-all duration-200 font-family-name:var(--font-be-vietnam-pro)",
                                    isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                                    isActive
                                        ? "bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                        : "hover:bg-white/5 hover:text-white"
                                )}
                                title={isCollapsed ? item.title : undefined}
                            >
                                <item.icon
                                    className={cn(
                                        "transition-colors",
                                        isCollapsed ? "h-6 w-6" : "h-5 w-5",
                                        isActive ? "text-amber-500" : "text-gray-500 group-hover:text-white"
                                    )}
                                />
                                {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-white/5 p-4">
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white font-family-name:var(--font-be-vietnam-pro)",
                            isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5 w-full"
                        )}
                        title={isCollapsed ? "Exit Admin" : undefined}
                    >
                        <LogOut className={cn(isCollapsed ? "h-6 w-6" : "h-5 w-5")} />
                        {!isCollapsed && <span className="text-sm font-medium">Exit Admin</span>}
                    </Link>
                </div>
            </div>
        </aside>
    );
}
