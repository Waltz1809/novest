import { auth } from "@/auth"
import { db } from "@/lib/db"
import { User } from "lucide-react"
import UserMenu from "./user-menu"
import Link from "next/link"

export default async function UserButton() {
    const session = await auth()

    if (!session?.user) {
        return (
            <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0B0C10] bg-[#F59E0B] hover:bg-[#D97706] rounded-full transition-colors shadow-[0_0_10px_rgba(245,158,11,0.3)]"
            >
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
            </Link>
        )
    }

    const wallet = await db.wallet.findUnique({
        where: { userId: session.user.id },
    });

    const balance = wallet?.balance || 0;

    return <UserMenu user={session.user} balance={balance} />
}
