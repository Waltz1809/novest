"use client";

import Link from "next/link";
import { ShieldAlert, Lock, Calendar, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRealUsername } from "@/hooks/use-real-username";

interface R18GateProps {
    novelTitle: string;
    novelSlug: string;
    reason: "not_logged_in" | "no_birthday" | "under_18";
}

export function R18Gate({ novelTitle, novelSlug, reason }: R18GateProps) {
    const { data: session } = useSession();
    const { username: realUsername } = useRealUsername(session?.user?.username);

    return (
        <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/50 border border-red-500/20 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-slate-100 mb-2">
                    Nội dung 18+
                </h1>
                <p className="text-slate-400 mb-6">
                    &quot;{novelTitle}&quot; là nội dung dành cho người lớn.
                </p>

                <div className="bg-slate-950/50 border border-white/5 rounded-xl p-4 mb-6">
                    {reason === "not_logged_in" && (
                        <div className="flex items-start gap-3 text-left">
                            <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-slate-300 font-medium">
                                    Bạn cần đăng nhập
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Chỉ người dùng đã đăng nhập và xác minh tuổi mới có thể xem nội dung này.
                                </p>
                            </div>
                        </div>
                    )}

                    {reason === "no_birthday" && (
                        <div className="flex items-start gap-3 text-left">
                            <Calendar className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-slate-300 font-medium">
                                    Bạn chưa cung cấp ngày sinh
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Vui lòng cập nhật ngày sinh trong cài đặt hồ sơ để xác minh tuổi.
                                </p>
                            </div>
                        </div>
                    )}

                    {reason === "under_18" && (
                        <div className="flex items-start gap-3 text-left">
                            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-slate-300 font-medium">
                                    Bạn chưa đủ 18 tuổi
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Nội dung này chỉ dành cho người từ 18 tuổi trở lên theo quy định của pháp luật.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {reason === "not_logged_in" && (
                        <Link
                            href="/login"
                            className="block w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-lg transition-colors"
                        >
                            Đăng nhập
                        </Link>
                    )}

                    {reason === "no_birthday" && realUsername && (
                        <Link
                            href={`/u/${realUsername}/settings`}
                            className="block w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-lg transition-colors"
                        >
                            Cập nhật ngày sinh
                        </Link>
                    )}

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full border border-white/10 hover:bg-white/5 text-slate-300 py-3 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
