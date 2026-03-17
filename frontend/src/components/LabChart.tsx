"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface LabDataPoint {
  date: string;
  value: number;
  source: string;
}

interface LabChartProps {
  title: string;
  unit: string;
  data: LabDataPoint[];
  refMin?: number;
  refMax?: number;
}

export default function LabChart({ title, unit, data, refMin, refMax }: LabChartProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const match = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(match.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    match.addEventListener("change", handler);
    return () => match.removeEventListener("change", handler);
  }, []);

  if (data.length === 0) {
    return (
      <div
        className="glass-panel rounded-[1.75rem] p-5"
        aria-label={`${title} trend chart`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {refMin !== undefined && refMax !== undefined
                ? `Reference: ${refMin}–${refMax} ${unit}`
                : `Unit: ${unit}`}
            </p>
          </div>
        </div>
        <div className="h-48 sm:h-56 flex items-center justify-center">
          <p className="text-sm text-slate-400">No data available</p>
        </div>
      </div>
    );
  }

  const gridStroke = isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(148, 163, 184, 0.12)";
  const tickFill = isDark ? "#94a3b8" : "#7c8da5";
  const tooltipBg = isDark ? "rgba(7, 18, 31, 0.96)" : "rgba(7, 18, 31, 0.96)";
  const tooltipColor = "#f8fafc";
  const tooltipBorder = "rgba(148, 163, 184, 0.22)";

  return (
    <div
      className="glass-panel rounded-[1.75rem] p-5"
      aria-label={`${title} trend chart`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {refMin !== undefined && refMax !== undefined
              ? `Reference: ${refMin}–${refMax} ${unit}`
              : `Unit: ${unit}`}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
            Results
          </span>
          {refMin !== undefined && (
            <span className="flex items-center gap-1">
              <span className="w-4 border-t border-dashed border-emerald-300" />
              Ref range
            </span>
          )}
        </div>
      </div>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: tickFill }}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tickFill }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: "16px",
                fontSize: "12px",
                color: tooltipColor,
                boxShadow: "0 20px 45px rgba(2, 8, 18, 0.35)",
              }}
              formatter={(value: number | undefined) => [`${value ?? ""} ${unit}`, title]}
              labelFormatter={(label: unknown) => `Date: ${label}`}
            />
            {refMin !== undefined && (
              <ReferenceLine y={refMin} stroke="#6ee7b7" strokeDasharray="4 4" />
            )}
            {refMax !== undefined && (
              <ReferenceLine y={refMax} stroke="#6ee7b7" strokeDasharray="4 4" />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="url(#medbridge-line-gradient)"
              strokeWidth={3}
              dot={{ r: 4, fill: "#68f0d8", stroke: "#04111f", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#68f0d8", stroke: "#ffffff", strokeWidth: 1.5 }}
            />
            <defs>
              <linearGradient id="medbridge-line-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="52%" stopColor="#68f0d8" />
                <stop offset="100%" stopColor="#8b7cff" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
