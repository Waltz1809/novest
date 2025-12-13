import { getPurchaseHistory } from "@/actions/wallet";
import WalletBalance from "@/components/wallet/wallet-balance";
import Link from "next/link";
import { Ticket, BookOpen, Clock, ArrowLeft } from "lucide-react";

export default async function PurchasesPage() {
    const purchases = await getPurchaseHistory();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link
                        href="/studio"
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">Lịch sử mua chương</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Các chương bạn đã mở khóa
                    </p>
                </div>
            </div>

            {/* Wallet Balance */}
            <div className="mb-6">
                <WalletBalance />
            </div>

            {/* Purchase List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-medium text-foreground flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-emerald-500" />
                        Đã mua ({purchases.length} chương)
                    </h2>
                </div>

                {purchases.length === 0 ? (
                    <div className="p-8 text-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-muted-foreground">Chưa mua chương nào</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Các chương bạn mở khóa sẽ hiển thị ở đây
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {purchases.map((purchase) => (
                            <div
                                key={purchase.chapterId}
                                className="p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Cover */}
                                    <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                        {purchase.chapter.volume.novel.coverImage ? (
                                            <img
                                                src={purchase.chapter.volume.novel.coverImage}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookOpen className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/truyen/${purchase.chapter.volume.novel.slug}/${purchase.chapter.slug}`}
                                            className="font-medium text-foreground hover:text-emerald-600 transition-colors line-clamp-1"
                                        >
                                            {purchase.chapter.title}
                                        </Link>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {purchase.chapter.volume.novel.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Ticket className="w-3.5 h-3.5 text-emerald-500" />
                                                {purchase.price} vé
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(purchase.createdAt).toLocaleDateString("vi-VN")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <Link
                                        href={`/truyen/${purchase.chapter.volume.novel.slug}/${purchase.chapter.slug}`}
                                        className="px-4 py-2 bg-gray-100 hover:bg-emerald-100 text-muted-foreground hover:text-emerald-700 text-sm rounded-lg transition-colors"
                                    >
                                        Đọc
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
