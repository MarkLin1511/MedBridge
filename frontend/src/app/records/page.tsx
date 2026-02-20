"use client";

import Navbar from "@/components/Navbar";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { useState } from "react";

type RecordType = "all" | "lab" | "medication" | "imaging" | "visit" | "wearable";

const records = [
  {
    id: 1,
    type: "lab" as const,
    title: "Complete Metabolic Panel (CMP)",
    description: "Potassium 4.1 mmol/L, Sodium 141 mmol/L, Calcium 9.8 mg/dL, Glucose 112 mg/dL",
    date: "2026-02-10",
    source: "Epic MyChart",
    provider: "Dr. Sarah Chen",
    flags: ["Glucose: High"],
  },
  {
    id: 2,
    type: "wearable" as const,
    title: "Weekly Health Summary",
    description: "Avg HR: 72 bpm, Avg HRV: 42 ms, Sleep: 7.2h avg, Steps: 8,400 avg/day",
    date: "2026-02-09",
    source: "Apple Watch",
    provider: "Self-reported",
    flags: [],
  },
  {
    id: 3,
    type: "lab" as const,
    title: "Hemoglobin A1c + Fasting Glucose",
    description: "A1c: 6.1% (High), Fasting Glucose: 112 mg/dL (High), Creatinine: 1.0 mg/dL",
    date: "2026-01-28",
    source: "VA Health",
    provider: "Dr. James Wright",
    flags: ["A1c: High", "Glucose: High"],
  },
  {
    id: 4,
    type: "medication" as const,
    title: "Metformin 500mg prescribed",
    description: "Take once daily with dinner. Monitor blood glucose weekly. Follow up in 3 months.",
    date: "2026-01-28",
    source: "VA Health",
    provider: "Dr. James Wright",
    flags: [],
  },
  {
    id: 5,
    type: "visit" as const,
    title: "Annual Physical Exam",
    description: "BP: 128/82, Weight: 185 lbs, BMI: 26.1. Pre-diabetic markers discussed. Lifestyle modifications recommended.",
    date: "2026-01-15",
    source: "Epic MyChart",
    provider: "Dr. Sarah Chen",
    flags: [],
  },
  {
    id: 6,
    type: "lab" as const,
    title: "Lipid Panel + TSH",
    description: "Total Cholesterol: 215 mg/dL (High), LDL: 140 mg/dL, HDL: 48 mg/dL, TSH: 2.4 mIU/L",
    date: "2025-12-15",
    source: "Epic MyChart",
    provider: "Dr. Sarah Chen",
    flags: ["Cholesterol: High"],
  },
  {
    id: 7,
    type: "imaging" as const,
    title: "Chest X-Ray",
    description: "No acute cardiopulmonary process. Heart size normal. Lungs clear bilaterally.",
    date: "2025-11-20",
    source: "VA Health",
    provider: "Dr. Maria Lopez",
    flags: [],
  },
  {
    id: 8,
    type: "visit" as const,
    title: "Cardiology Consultation",
    description: "Elevated cholesterol discussed. Statin therapy considered but deferred for lifestyle changes. Recheck in 6 months.",
    date: "2025-11-10",
    source: "Epic MyChart",
    provider: "Dr. Raj Patel",
    flags: [],
  },
];

const typeConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  lab: { label: "Lab", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-900/40", dot: "bg-teal-400" },
  medication: { label: "Rx", color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-900/40", dot: "bg-violet-400" },
  imaging: { label: "Imaging", color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-50 dark:bg-cyan-900/40", dot: "bg-cyan-400" },
  visit: { label: "Visit", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/40", dot: "bg-amber-400" },
  wearable: { label: "Wearable", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/40", dot: "bg-emerald-400" },
};

const filterOptions: { value: RecordType; label: string }[] = [
  { value: "all", label: "All Records" },
  { value: "lab", label: "Labs" },
  { value: "medication", label: "Medications" },
  { value: "imaging", label: "Imaging" },
  { value: "visit", label: "Visits" },
  { value: "wearable", label: "Wearable" },
];

export default function RecordsPage() {
  const [filter, setFilter] = useState<RecordType>("all");
  const filtered = filter === "all" ? records : records.filter((r) => r.type === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FadeIn>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Records</h1>
          <p className="mt-1 text-sm text-gray-500">Complete timeline across all connected portals and devices</p>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.1}>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === opt.value
                    ? "bg-teal-600 text-white"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-teal-300 dark:hover:border-teal-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Timeline */}
        <div className="mt-8 relative">
          <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />

          <FadeInStagger className="space-y-4">
            {filtered.map((record) => {
              const config = typeConfig[record.type];
              return (
                <FadeInStaggerItem key={record.id}>
                  <div className="relative pl-10 sm:pl-14">
                    {/* Timeline dot */}
                    <div className={`absolute left-2.5 sm:left-4.5 top-5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-950 ${config.dot} ring-2 ring-gray-200 dark:ring-gray-800`} />

                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400">{record.date}</span>
                        <span className="text-xs text-gray-400">&middot;</span>
                        <span className="text-xs text-gray-500">{record.source}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{record.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{record.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-400">{record.provider}</span>
                        {record.flags.map((flag) => (
                          <span key={flag} className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeInStaggerItem>
              );
            })}
          </FadeInStagger>
        </div>
      </div>
    </div>
  );
}
