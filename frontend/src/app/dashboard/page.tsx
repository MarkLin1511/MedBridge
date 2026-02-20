import Link from "next/link";

const patient = {
  name: "Marcus Johnson",
  dob: "1988-03-14",
  id: "MBR-20240001",
  connectedPortals: ["Epic MyChart", "VA Health"],
  wearable: "Apple Watch Series 9",
};

const labResults = [
  { test: "Potassium", loinc: "2823-3", value: 4.1, unit: "mmol/L", range: "3.5–5.0", status: "normal", date: "2026-02-10", source: "Epic MyChart" },
  { test: "Sodium", loinc: "2951-2", value: 141, unit: "mmol/L", range: "136–145", status: "normal", date: "2026-02-10", source: "Epic MyChart" },
  { test: "Calcium", loinc: "17861-6", value: 9.8, unit: "mg/dL", range: "8.5–10.5", status: "normal", date: "2026-02-10", source: "Epic MyChart" },
  { test: "Glucose (fasting)", loinc: "1558-6", value: 112, unit: "mg/dL", range: "70–100", status: "high", date: "2026-01-28", source: "VA Health" },
  { test: "Hemoglobin A1c", loinc: "4548-4", value: 6.1, unit: "%", range: "4.0–5.6", status: "high", date: "2026-01-28", source: "VA Health" },
  { test: "Creatinine", loinc: "2160-0", value: 1.0, unit: "mg/dL", range: "0.7–1.3", status: "normal", date: "2026-01-28", source: "VA Health" },
  { test: "TSH", loinc: "3016-3", value: 2.4, unit: "mIU/L", range: "0.4–4.0", status: "normal", date: "2025-12-15", source: "Epic MyChart" },
  { test: "Cholesterol (total)", loinc: "2093-3", value: 215, unit: "mg/dL", range: "<200", status: "high", date: "2025-12-15", source: "Epic MyChart" },
];

const vitals = [
  { label: "Avg Heart Rate", value: "72 bpm", trend: "stable", period: "Last 7 days" },
  { label: "Avg HRV", value: "42 ms", trend: "up", period: "Last 7 days" },
  { label: "Blood Pressure", value: "128/82", trend: "stable", period: "Last reading" },
  { label: "Resting HR", value: "64 bpm", trend: "down", period: "Last 30 days" },
];

const auditLog = [
  { action: "Lab results viewed", by: "Dr. Sarah Chen (PCP)", when: "2 hours ago" },
  { action: "Wearable data synced", by: "Apple Watch", when: "6 hours ago" },
  { action: "Records shared", by: "You → Dr. Patel (Cardiology)", when: "2 days ago" },
  { action: "Lab results ingested", by: "VA Health Portal", when: "3 weeks ago" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "high") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">High</span>;
  }
  if (status === "low") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">Low</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Normal</span>;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <span className="text-green-600">&#8593;</span>;
  if (trend === "down") return <span className="text-blue-600">&#8595;</span>;
  return <span className="text-slate-400">&#8594;</span>;
}

function SourceBadge({ source }: { source: string }) {
  const colors = source.includes("Epic")
    ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
    : "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors}`}>{source}</span>;
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Nav */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">MedBridge</span>
            </Link>
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <span className="text-blue-600 font-medium">Dashboard</span>
              <span className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Records</span>
              <span className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Providers</span>
              <span className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Settings</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">MJ</div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Demo banner */}
        <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          This is a demo dashboard with mock data. In production, this would display your real health records from connected portals.
        </div>

        {/* Patient header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{patient.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
              <span>DOB: {patient.dob}</span>
              <span>&middot;</span>
              <span>ID: {patient.id}</span>
              <span>&middot;</span>
              <span>Wearable: {patient.wearable}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {patient.connectedPortals.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Vitals from wearable */}
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Wearable Vitals</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {vitals.map((v) => (
            <div key={v.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="text-sm text-slate-500">{v.label}</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {v.value} <TrendIcon trend={v.trend} />
              </div>
              <div className="text-xs text-slate-400 mt-1">{v.period}</div>
            </div>
          ))}
        </div>

        {/* Lab results */}
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Lab Results (All Portals)</h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Test</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">LOINC</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Result</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Range</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Source</th>
                </tr>
              </thead>
              <tbody>
                {labResults.map((lab) => (
                  <tr key={`${lab.loinc}-${lab.date}`} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{lab.test}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{lab.loinc}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{lab.value} {lab.unit}</td>
                    <td className="px-4 py-3 text-slate-500">{lab.range}</td>
                    <td className="px-4 py-3"><StatusBadge status={lab.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{lab.date}</td>
                    <td className="px-4 py-3"><SourceBadge source={lab.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit log */}
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Access Log</h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
          {auditLog.map((entry, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-slate-900 dark:text-white">{entry.action}</span>
                <span className="text-sm text-slate-500 ml-2">— {entry.by}</span>
              </div>
              <span className="text-xs text-slate-400">{entry.when}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
