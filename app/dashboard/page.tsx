import { auth } from "@/auth";

export default async function DashboardPage() {
    const session = await auth();

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Chào mừng quay lại, {session?.user?.name}
            </h1>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <p className="text-gray-500">
                    Đây là trang quản trị dành cho Admin và Translator.
                </p>
            </div>
        </div>
    );
}
