import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addMockBalance } from "@/actions/wallet";
import { PlusCircle, Coins } from "lucide-react";

export default async function AddCoinBtn() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const wallet = await db.wallet.findUnique({
        where: { userId: session.user.id },
    });

    const balance = wallet?.balance || 0;

    return (
        <div className="flex items-center gap-3 mr-4">
            <div className="flex items-center gap-1 text-yellow-600 font-medium bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
                <Coins className="w-4 h-4" />
                <span>{balance.toLocaleString()} Xu</span>
            </div>

            <form
                action={async () => {
                    "use server";
                    await addMockBalance();
                }}
            >
                <button
                    type="submit"
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                    <PlusCircle className="w-3 h-3" />
                    +1000
                </button>
            </form>
        </div>
    );
}
