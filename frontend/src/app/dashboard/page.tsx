"use client";

import Navbar from "@/components/Navbar";
import LabChart from "@/components/LabChart";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { motion } from "framer-motion";

const patient = {
  name: "Marcus Johnson",
  dob: "1988-03-14",
  id: "MBR-20240001",
  connectedPortals: ["Epic MyChart", "VA Health"],
  wearable: "Apple Watch Series 9",
};

const labResults = [
  { test: "Potassium", loinc: "2823-3", value: 4.1, unit: "mmol/L", range: "3.5-5.0", status: "normal", date: "2026-02-10", source: "Epic MyChart" },
  { test: "Sodium", loinc: "2951-2", value: 141, unit: "mmol/L", range: "136-145", status: "normal", date: "2026-02-10", source: "Epic MyChart" },
  { test: "Calcium", loinc: "17861-6", value: 9.8, unit: "mg/dL", range: "8.5-10.5", status: "normal", date: "2026-02-10", source: "Epic MyChart" },
  { test: "Glucose (fasting)", loinc: "1558-6", value: 112, unit: "mg/dL", range: "70-100", status: "high", date: "2026-01-28", source: "VA Health" },
  { test: "Hemoglobin A1c", loinc: "4548-4", value: 6.1, unit: "%", range: "4.0-5.6", status: "high", date: "2026-01-28", source: "VA Health" },
  { test: "Creatinine", loinc: "2160-0", value: 1.0, unit: "mg/dL", range: "0.7-1.3", status: "normal", date: "2026-01-28", source: "VA Health" },
  { test: "TSH", loinc: "3016-3", value: 2.4, unit: "mIU/L", range: "0.4-4.0", status: "normal", date: "2025-12-15", source: "Epic MyChart" },
  { test: "Cholesterol (total)", loinc: "2093-3", value: 215, unit: "mg/dL", range: "<200", status: "high", date: "2025-12-15", source: "Epic MyChart" },
];

const glucoseHistory = [
  { date: "Jun 25", value: 95, source: "Epic" },
  { date: "Aug 25", value: 98, source: "Epic" },
  { date: "Oct 25", value: 105, source: "VA" },
  { date: "Dec 25", value: 108, source: "Epic" },
  { date: "Jan 26", value: 112, source: "VA" },
];

const a1cHistory = [
  { date: "Mar 25", value: 5.4, source: "Epic" },
  { date: "Jun 25", value: 5.5, source: "Epic" },
  { date: "Sep 25", value: 5.7, source: "VA" },
  { date: "Dec 25", value: 5.9, source: "Epic" },
  { date: "Jan 26", value: 6.1, source: "VA" },
];

const cholesterolHistory = [
  { date: "Mar 25", value: 195, source: "Epic" },
  { date: "Jun 25", value: 200, source: "Epic" },
  { date: "Sep 25", value: 208, source: "VA" },
  { date: "Dec 25", value: 215, source: "Epic" },
];

const vitals = [
  { label: "Avg Heart Rate", value: "72 bpm", trend: "stable", period: "Last 7 days" },
  { label: "Avg HRV", value: "42 ms", trend: "up", period: "Last 7 days" },
  { label: "Blood Pressure", value: "128/82", trend: "stable", period: "Last reading" },
  { label: "Resting HR", value: "64 bpm", trend: "down", period: "Last 30 days" },
];

const auditLog = [
  { action: "Lab results viewed", by: "Dr. Sarah Chen (PCP)", when: "2 hours ago", icon: "eye" },
  { action: "Wearable data synced", by: "Apple Watch", when: "6 hours ago", icon: "sync" },
  { action: "Records shared", by: "You \u2192 Dr. Patel (Cardiology)", when: "2 days ago", icon: "share" },
  { action: "Lab results ingested", by: "VA Health Portal", when: "3 weeks ago", icon: "download" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "high") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300">
        High
      </span>
    );
  }
  if (status === "low") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
        Low
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
      Normal
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <span className="text-emerald-500 text-lg">&uarr;</span>;
  if (trend === "down") return <span className="text-teal-500 text-lg">&darr;</span>;
  return <span className="text-gray-400 text-lg">&rarr;</span>;
}

function SourceBadge({ source }: { source: string }) {
  const colors = source.includes("Epic")
    ? "bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
    : "bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      {source}
    </span>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Demo banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl px-4 py-3 text-sm text-teal-800 dark:text-teal-200"
        >
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <span>
            You&apos;re viewing a demo with sample data. Connect your health portals to see your real records.
          </span>
        </motion.div>

        {/* Patient header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.name}</h1>
              <p className="flex flex-wrap items-center gap-x-2 mt-1 text-sm text-gray-500">
                <span>DOB: {patient.dob}</span>
                <span>&middot;</span>
                <span>ID: {patient.id}</span>
                <span>&middot;</span>
                <span>{patient.wearable}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {patient.connectedPortals.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {p}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Vitals */}
        <FadeIn delay={0.1}>
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vitals</h2>
            <span className="text-sm text-gray-400">from Apple Watch</span>
          </div>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {vitals.map((v) => (
            <FadeInStaggerItem key={v.label}>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                <div className="text-sm text-gray-500">{v.label}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {v.value} <TrendIcon trend={v.trend} />
                </div>
                <div className="text-xs text-gray-400 mt-1">{v.period}</div>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>

        {/* Lab Trends */}
        <FadeIn delay={0.1}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lab Trends</h2>
        </FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <FadeIn delay={0.1}>
            <LabChart title="Glucose (fasting)" unit="mg/dL" data={glucoseHistory} refMin={70} refMax={100} />
          </FadeIn>
          <FadeIn delay={0.2}>
            <LabChart title="Hemoglobin A1c" unit="%" data={a1cHistory} refMin={4.0} refMax={5.6} />
          </FadeIn>
          <FadeIn delay={0.3}>
            <LabChart title="Cholesterol (total)" unit="mg/dL" data={cholesterolHistory} refMax={200} />
          </FadeIn>
        </div>

        {/* Lab results table */}
        <FadeIn delay={0.1}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Lab Results</h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Test</th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-gray-500 hidden sm:table-cell">LOINC</th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Result</th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-gray-500 hidden md:table-cell">Range</th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Status</th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-gray-500 hidden lg:table-cell">Date</th>
                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium text-gray-500">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {labResults.map((lab) => (
                    <tr
                      key={`${lab.loinc}-${lab.date}`}
                      className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{lab.test}</td>
                      <td className="px-5 py-3.5 text-gray-500 font-mono text-xs hidden sm:table-cell">{lab.loinc}</td>
                      <td className="px-5 py-3.5 text-gray-900 dark:text-white font-medium">{lab.value} {lab.unit}</td>
                      <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{lab.range}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={lab.status} /></td>
                      <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{lab.date}</td>
                      <td className="px-5 py-3.5"><SourceBadge source={lab.source} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>

        {/* Audit log */}
        <FadeIn delay={0.1}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Access Log</h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800">
            {auditLog.map((entry, i) => (
              <div
                key={i}
                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div>
                  <span className="text-sm text-gray-900 dark:text-white">{entry.action}</span>
                  <span className="text-sm text-gray-500 ml-2">by {entry.by}</span>
                </div>
                <span className="text-xs text-gray-400">{entry.when}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
