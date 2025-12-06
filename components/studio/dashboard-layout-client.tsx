"use client";

import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/studio/dashboard-sidebar";

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    user: {
        name: string;
        email: string;
        image: string | null;
        role: string;
    };
    userRole: string;
    balance: number;
}

export default function DashboardLayoutClient({
    children,
    user,
    userRole,
    balance,
}: DashboardLayoutClientProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Handle resize and initial state
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) {
                // On desktop, check local storage for collapsed state
                const saved = localStorage.getItem("sidebar-collapsed");
                if (saved) {
                    setIsCollapsed(JSON.parse(saved));
                }
            } else {
                setIsCollapsed(false); // Reset on mobile (handled by isMobileOpen)
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const toggleSidebar = () => {
        if (isMobile) {
            setIsMobileOpen(!isMobileOpen);
        } else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
        }
    };

    return (
        <div className="flex flex-1 relative z-10 transition-all duration-300">
            {/* Sidebar */}
            <DashboardSidebar
                user={user}
                userRole={userRole}
                balance={balance}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
                isMobileOpen={isMobileOpen}
                onToggle={toggleSidebar}
                onMobileClose={() => setIsMobileOpen(false)}
            />

            {/* Main Content */}
            <main
                className={`
                    flex-1 p-4 lg:p-8 mt-16 transition-all duration-300 w-full
                    ${isMobile ? "ml-16" : (isCollapsed ? "lg:ml-16" : "lg:ml-64")}
                `}
            >
                {children}
            </main>
        </div>
    );
}
