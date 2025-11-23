import Link from "next/link";
import { BookOpen } from "lucide-react";
import UserButton from "@/components/auth/user-button";
import AddCoinBtn from "@/components/test/add-coin-btn";
import SearchBar from "@/components/search/search-bar";

export default function MainHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 hover:opacity-80 transition-opacity">
                    <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
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
                    <UserButton />
                </div>
            </div>
        </header>
    );
}
