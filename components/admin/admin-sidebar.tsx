"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    BookOpen,
    Tag,
    Ticket,
    Megaphone,
    Shield,
    LogOut,
    Menu,
    X,
    Users2
} from "lucide-react";
import { useState, useEffect } from "react";
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
        title: "Nhóm dịch",
        href: "/admin/groups",
        icon: Users2,
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
        adminOnly: true,
    },
    {
        title: "Nhật ký",
        href: "/admin/logs",
        icon: Shield,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";

    // Filter items based on role
    const visibleItems = sidebarItems.filter(item => !item.adminOnly || isAdmin);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("admin-sidebar-collapsed");
        if (saved !== null) {
            setIsCollapsed(JSON.parse(saved));
        }
    }, []);

    // Toggle collapse and save to localStorage
    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("admin-sidebar-collapsed", JSON.stringify(newState));
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white text-foreground shadow-sm transition-all duration-300",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className={cn(
                    "flex h-16 items-center border-b border-gray-200",
                    isCollapsed ? "justify-center" : "justify-between px-6"
                )}>
                    {!isCollapsed && (
                        <Link href="/" className="flex items-center gap-2 font-bold text-foreground font-family-name:var(--font-be-vietnam-pro)">
                            <span className="text-primary">Novest</span>
                            <span className="text-xs font-normal text-muted-foreground">Admin</span>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCollapse}
                        className="text-muted-foreground hover:text-foreground hover:bg-gray-100"
                    >
                        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {visibleItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center rounded-lg transition-all duration-200 font-family-name:var(--font-be-vietnam-pro)",
                                    isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "hover:bg-gray-100 hover:text-foreground"
                                )}
                                title={isCollapsed ? item.title : undefined}
                            >
                                <item.icon
                                    className={cn(
                                        "transition-colors",
                                        isCollapsed ? "h-6 w-6" : "h-5 w-5",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                    )}
                                />
                                {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4">
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground font-family-name:var(--font-be-vietnam-pro)",
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
