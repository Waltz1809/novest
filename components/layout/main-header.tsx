import Link from "next/link";
import { BookOpen } from "lucide-react";
import UserButton from "@/components/auth/user-button";
import SearchBar from "@/components/search/search-bar";
import { NotificationBell } from "@/components/notification/notification-bell";

export default function MainHeader() {
    return (
        <header className="sticky top-0 z-50 w-full bg-[#0B0C10] border-b border-[#34D399]/20 shadow-lg">
            <div className="container mx-auto px-3 h-14 flex items-center justify-between gap-2">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white hover:text-[#FBBF24] transition-colors shrink-0">
                    <div className="p-1.5 bg-[#F59E0B] rounded-lg text-[#0B0C10] glow-amber">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="hidden min-[400px]:inline">Novest</span>
                </Link>

                {/* Desktop Search Bar - visible at 640px and above */}
                <div className="hidden min-[640px]:flex flex-1 max-w-md mx-2">
                    <SearchBar />
                </div>

                {/* Right Side Nav */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Mobile Search Button - visible below 640px */}
                    <div className="flex min-[640px]:hidden">
                        <SearchBar mobileMode />
                    </div>
                    <NotificationBell />
                    <UserButton />
                </div>
            </div>
        </header>
    );
}