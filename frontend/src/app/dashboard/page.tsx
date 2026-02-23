"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LabChart from "@/components/LabChart";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { useAuth } from "@/lib/auth";
import { api, DashboardData } from "@/lib/api";

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
    : source.includes("VA")
    ? "bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300"
    : "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      {source}
    </span>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    api
      .dashboard()
      .then(setData)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading your health data...</span>
          </div>
        </div>
      </div>
    );
  }

  const { patient, vitals, lab_trends, recent_labs, audit_log } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Patient header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{patient.name}</h1>
              <p className="flex flex-wrap items-center gap-x-2 mt-1 text-sm text-gray-500">
                <span>DOB: {patient.dob}</span>
                <span>&middot;</span>
                <span>ID: {patient.patient_id}</span>
                {patient.wearable && (
                  <>
                    <span>&middot;</span>
                    <span>{patient.wearable}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {patient.connected_portals.map((p) => (
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
        {vitals.length > 0 && (
          <>
            <FadeIn delay={0.1}>
              <div className="flex items-baseline gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vitals</h2>
                {patient.wearable && <span className="text-sm text-gray-400">from {patient.wearable}</span>}
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
          </>
        )}

        {/* Lab Trends */}
        <FadeIn delay={0.1}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lab Trends</h2>
        </FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {lab_trends.glucose.length > 0 && (
            <FadeIn delay={0.1}>
              <LabChart title="Glucose (fasting)" unit="mg/dL" data={lab_trends.glucose} refMin={70} refMax={100} />
            </FadeIn>
          )}
          {lab_trends.a1c.length > 0 && (
            <FadeIn delay={0.2}>
              <LabChart title="Hemoglobin A1c" unit="%" data={lab_trends.a1c} refMin={4.0} refMax={5.6} />
            </FadeIn>
          )}
          {lab_trends.cholesterol.length > 0 && (
            <FadeIn delay={0.3}>
              <LabChart title="Cholesterol (total)" unit="mg/dL" data={lab_trends.cholesterol} refMax={200} />
            </FadeIn>
          )}
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
                  {recent_labs.map((lab, i) => (
                    <tr
                      key={`${lab.loinc}-${lab.date}-${i}`}
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
            {audit_log.map((entry, i) => (
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
