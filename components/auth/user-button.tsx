import { auth, signIn } from "@/auth"
import { User, UserPlus } from "lucide-react"
import UserMenu from "./user-menu"
import Link from "next/link"

export default async function UserButton() {
    const session = await auth()

    if (!session?.user) {
        return (
            <div className="flex items-center gap-2">
                {/* Sign Up Button */}
                <Link
                    href="/register"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    <span>Đăng ký</span>
                </Link>

                {/* Login Button - shows all providers */}
                <form
                    action={async () => {
                        "use server"
                        await signIn() // No provider specified = shows all providers
                    }}
                >
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors"
                    >
                        <User className="w-4 h-4" />
                        <span>Login</span>
                    </button>
                </form>
            </div>
        )
    }

    return <UserMenu user={session.user} />
}
