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
                        className="flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors text-sm mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Lịch sử mua chương</h1>
                    <p className="text-[#9CA3AF] text-sm mt-1">
                        Các chương bạn đã mở khóa
                    </p>
                </div>
            </div>

            {/* Wallet Balance */}
            <div className="mb-6">
                <WalletBalance />
            </div>

            {/* Purchase List */}
            <div className="bg-[#1E293B] rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-medium text-white flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-amber-500" />
                        Đã mua ({purchases.length} chương)
                    </h2>
                </div>

                {purchases.length === 0 ? (
                    <div className="p-8 text-center">
                        <BookOpen className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3 opacity-50" />
                        <p className="text-[#9CA3AF]">Chưa mua chương nào</p>
                        <p className="text-sm text-[#9CA3AF]/70 mt-1">
                            Các chương bạn mở khóa sẽ hiển thị ở đây
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {purchases.map((purchase) => (
                            <div
                                key={purchase.chapterId}
                                className="p-4 hover:bg-white/2 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Cover */}
                                    <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-[#0B0C10]">
                                        {purchase.chapter.volume.novel.coverImage ? (
                                            <img
                                                src={purchase.chapter.volume.novel.coverImage}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookOpen className="w-5 h-5 text-[#9CA3AF]" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/truyen/${purchase.chapter.volume.novel.slug}/${purchase.chapter.slug}`}
                                            className="font-medium text-white hover:text-amber-400 transition-colors line-clamp-1"
                                        >
                                            {purchase.chapter.title}
                                        </Link>
                                        <p className="text-sm text-[#9CA3AF] line-clamp-1">
                                            {purchase.chapter.volume.novel.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-[#9CA3AF]">
                                            <span className="flex items-center gap-1">
                                                <Ticket className="w-3.5 h-3.5 text-amber-400" />
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
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-[#9CA3AF] hover:text-white text-sm rounded-lg transition-colors"
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
