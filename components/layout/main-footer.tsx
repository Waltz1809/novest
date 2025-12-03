import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function MainFooter() {
    return (
        <footer className="w-full bg-[#0B0C10]/95 backdrop-blur-md border-t border-[#34D399]/20 mt-auto">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
                    {/* Brand Column */}
                    <div className="space-y-3 col-span-2 md:col-span-3">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white hover:text-[#FBBF24] transition-colors w-fit">
                            <div className="p-1.5 bg-[#F59E0B] rounded-lg text-[#0B0C10] glow-amber">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <span>Novest</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Nền tảng đọc truyện chữ online hàng đầu Việt Nam.
                        </p>
                    </div>

                    {/* Community */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-3 md:mb-4 text-sm md:text-base">Cộng đồng</h3>
                        <ul className="space-y-1.5 md:space-y-2">
                            <li>
                                <Link href="/ve-chung-toi" className="text-gray-400 hover:text-[#F59E0B] transition-colors text-xs md:text-sm">
                                    Về chúng tôi
                                </Link>
                            </li>
                            <li>
                                <Link href="/ho-tro" className="text-gray-400 hover:text-[#F59E0B] transition-colors text-xs md:text-sm">
                                    Hỗ trợ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="col-span-1">
                        <h3 className="text-white font-semibold mb-3 md:mb-4 text-sm md:text-base">Pháp lý</h3>
                        <ul className="space-y-1.5 md:space-y-2">
                            <li>
                                <Link href="/dieu-khoan" className="text-gray-400 hover:text-[#F59E0B] transition-colors text-xs md:text-sm">
                                    Điều khoản sử dụng
                                </Link>
                            </li>
                            <li>
                                <Link href="/chinh-sach-bao-mat" className="text-gray-400 hover:text-[#F59E0B] transition-colors text-xs md:text-sm">
                                    Chính sách bảo mật
                                </Link>
                            </li>
                            <li>
                                <Link href="/dmca" className="text-gray-400 hover:text-[#F59E0B] transition-colors text-xs md:text-sm">
                                    DMCA
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 md:mt-12 pt-6 border-t border-[#34D399]/10">
                    <p className="text-left text-gray-500 text-xs md:text-sm">
                        © 2025 <span className="text-[#F59E0B] font-semibold">Novest</span>. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
