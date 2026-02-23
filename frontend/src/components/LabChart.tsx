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
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
        aria-label={`${title} trend chart`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {refMin !== undefined && refMax !== undefined
                ? `Reference: ${refMin}–${refMax} ${unit}`
                : `Unit: ${unit}`}
            </p>
          </div>
        </div>
        <div className="h-48 sm:h-56 flex items-center justify-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const gridStroke = isDark ? "#374151" : "#f3f4f6";
  const tickFill = isDark ? "#9ca3af" : "#9ca3af";
  const tooltipBg = isDark ? "#111827" : "#ffffff";
  const tooltipColor = isDark ? "#ffffff" : "#111827";
  const tooltipBorder = isDark ? "#374151" : "#e5e7eb";

  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
      aria-label={`${title} trend chart`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {refMin !== undefined && refMax !== undefined
              ? `Reference: ${refMin}–${refMax} ${unit}`
              : `Unit: ${unit}`}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            Results
          </span>
          {refMin !== undefined && (
            <span className="flex items-center gap-1">
              <span className="w-4 border-t border-dashed border-emerald-500" />
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
                borderRadius: "8px",
                fontSize: "12px",
                color: tooltipColor,
              }}
              formatter={(value: number | undefined) => [`${value ?? ""} ${unit}`, title]}
              labelFormatter={(label: unknown) => `Date: ${label}`}
            />
            {refMin !== undefined && (
              <ReferenceLine y={refMin} stroke="#10b981" strokeDasharray="4 4" />
            )}
            {refMax !== undefined && (
              <ReferenceLine y={refMax} stroke="#10b981" strokeDasharray="4 4" />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0d9488"
              strokeWidth={2}
              dot={{ r: 4, fill: "#0d9488", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#0d9488", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
