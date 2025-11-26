import { auth } from "@/auth";

export default async function DashboardPage() {
    const session = await auth();

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
                Chào mừng quay lại, {session?.user?.name}
            </h1>
            <div className="bg-card p-6 rounded-xl shadow-md">
                <p className="text-muted-foreground">
                    Đây là trang quản trị dành cho Admin và Translator.
                </p>
            </div>
        </div>
    );
}
