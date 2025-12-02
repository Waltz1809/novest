import Link from "next/link";
import { BookOpen } from "lucide-react";
import UserButton from "@/components/auth/user-button";
import AddCoinBtn from "@/components/test/add-coin-btn";
import SearchBar from "@/components/search/search-bar";
import { NotificationBell } from "@/components/notification/notification-bell";


export default function MainHeader() {
    return (
        <header className="sticky top-0 z-50 w-full bg-[#0B0C10]/95 backdrop-blur-md border-b border-[#34D399]/20 shadow-lg">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white hover:text-[#FBBF24] transition-colors">
                    <div className="p-1.5 bg-[#F59E0B] rounded-lg text-[#0B0C10] glow-amber">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <span>Novest</span>
                </Link>

                {/* Search Bar */}
                <div className="flex-1 max-w-md mx-4">
                    <SearchBar />
                </div>

                {/* User Nav */}
                <div className="flex items-center gap-2">
                    <AddCoinBtn />
                    <NotificationBell />
                    <UserButton />
                </div>
            </div>
        </header>
    );
}