"use client";

import { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface ReadershipChartProps {
    className?: string;
}

// Mock data - replace with real data from server actions
const generateMockData = (days: number) => {
    const data = [];
    const baseValue = 20000000; // 20M
    for (let i = 0; i < days; i++) {
        data.push({
            day: i === 0 ? "Hôm nay" : `Ngày ${i + 1}`,
            views: baseValue + Math.random() * 80000000 + (i * 2000000),
        });
    }
    return data;
};

const timePeriods = [
    { label: "7 ngày qua", value: 7 },
    { label: "15 ngày qua", value: 15 },
    { label: "30 ngày qua", value: 30 },
];

export default function ReadershipChart({ className = "" }: ReadershipChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(30);
    const data = generateMockData(selectedPeriod);

    return (
        <div
            className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Tăng trưởng độc giả</h2>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                    className="px-4 py-2 bg-gray-50 text-foreground rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                >
                    {timePeriods.map((period) => (
                        <option key={period.value} value={period.value}>
                            {period.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Chart */}
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.6} />
                                <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                            strokeOpacity={0.5}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="day"
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            axisLine={{ stroke: "#e5e7eb" }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            axisLine={{ stroke: "#e5e7eb" }}
                            tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(0)}Tr`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}N`;
                                return value;
                            }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                color: "#1f2937",
                            }}
                            labelStyle={{ color: "#6b7280" }}
                            formatter={(value: number) => [
                                value.toLocaleString("vi-VN"),
                                "Lượt xem",
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            fill="url(#chartGradient)"
                            isAnimationActive={true}
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
