import { auth, signIn } from "@/auth"
import { User } from "lucide-react"
import UserMenu from "./user-menu"

export default async function UserButton() {
    const session = await auth()

    if (!session?.user) {
        return (
            <form
                action={async () => {
                    "use server"
                    await signIn("google")
                }}
            >
                <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                >
                    <User className="w-4 h-4" />
                    <span>Login</span>
                </button>
            </form>
        )
    }

    return <UserMenu user={session.user} />
}
