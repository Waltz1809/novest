import { auth, signIn, signOut } from "@/auth"
import { User, LogOut } from "lucide-react"
import Image from "next/image"

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

    return (
        <div className="flex items-center gap-3">
            {session.user.image ? (
                <Image
                    src={session.user.image}
                    alt={session.user.name || "User Avatar"}
                    width={32}
                    height={32}
                    className="rounded-full border border-gray-200"
                />
            ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <User className="w-4 h-4" />
                </div>
            )}

            <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                {session.user.name}
            </span>

            <form
                action={async () => {
                    "use server"
                    await signOut()
                }}
            >
                <button
                    type="submit"
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </form>
        </div>
    )
}
