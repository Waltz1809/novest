"use client";

import { useState, useEffect } from "react";
import { Ticket, Loader2 } from "lucide-react";
import { getWalletBalance } from "@/actions/wallet";

interface WalletBalanceProps {
    compact?: boolean;
}

export default function WalletBalance({ compact = false }: WalletBalanceProps) {
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadBalance();
    }, []);

    const loadBalance = async () => {
        setIsLoading(true);
        const balance = await getWalletBalance();
        setBalance(balance);
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 ${compact ? "px-2 py-1" : "px-3 py-2"}`}>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            </div>
        );
    }

    // Compact version for header
    if (compact) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 rounded-lg cursor-pointer hover:bg-amber-500/20 transition-colors">
                <Ticket className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">
                    {balance?.toLocaleString() ?? 0}
                </span>
            </div>
        );
    }

    // Full version - balance display only
    return (
        <div className="bg-[#1E293B] rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 rounded-lg">
                    <Ticket className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">Số dư</p>
                    <p className="text-2xl font-bold text-white">
                        {balance?.toLocaleString() ?? 0}
                        <span className="text-sm text-[#9CA3AF] ml-1">vé</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

