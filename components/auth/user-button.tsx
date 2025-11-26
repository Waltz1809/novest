import { auth } from "@/auth"
import { User } from "lucide-react"
import UserMenu from "./user-menu"
import Link from "next/link"

export default async function UserButton() {
    const session = await auth()

    if (!session?.user) {
        return (
            <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors"
            >
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
            </Link>
        )
    }

    return <UserMenu user={session.user} />
}
