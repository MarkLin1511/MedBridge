"use client";

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
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={{ stroke: "#f3f4f6" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "none",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#ffffff",
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
