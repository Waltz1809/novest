import Link from "next/link";
import { Book } from "lucide-react";
import UserButton from "@/components/auth/user-button";
import AddCoinBtn from "@/components/test/add-coin-btn";

export default function MainHeader() {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <Book className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-indigo-900 tracking-tight">
                        Novest
                    </span>
                </Link>

                <div className="flex items-center">
                    <AddCoinBtn />
                    <UserButton />
                </div>
            </div>
        </header>
    );
}
