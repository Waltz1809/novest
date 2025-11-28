"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

interface StatCardProps {
    title: string;
    value: string;
    badge: number;
    trend?: "up" | "down";
    trendValue?: string;
    miniChartData?: { value: number }[];
    className?: string;
}

export default function StatCard({
    title,
    value,
    badge,
    trend,
    trendValue,
    miniChartData,
    className = "",
}: StatCardProps) {
    return (
        <div
            className={`relative bg-[#1E293B] rounded-2xl p-6 border border-[#34D399]/20 hover:border-[#34D399]/40 transition-all duration-300 overflow-hidden group ${className}`}
        >
            {/* Badge Number */}
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[#0B0C10] border border-[#F59E0B]/30 flex items-center justify-center">
                <span className="text-[#F59E0B] font-bold text-sm">{badge}</span>
            </div>

            {/* Title */}
            <h3 className="text-[#9CA3AF] text-sm font-medium uppercase tracking-wide mb-3">
                {title}
            </h3>

            {/* Main Value with Glow */}
            <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-bold text-[#F59E0B] glow-gold-text">
                    {value}
                </span>
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-[#34D399]" : "text-[#EF4444]"
                        }`}>
                        {trend === "up" ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>

            {/* Mini Chart */}
            {miniChartData && miniChartData.length > 0 && (
                <div className="h-16 -mx-2 -mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={miniChartData}>
                            <defs>
                                <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#F59E0B"
                                strokeWidth={2}
                                fill="url(#miniGradient)"
                                isAnimationActive={true}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/0 to-[#F59E0B]/0 group-hover:from-[#F59E0B]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-2xl" />
        </div>
    );
}
