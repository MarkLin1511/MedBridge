"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import LabChart from "@/components/LabChart";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { useAuth } from "@/lib/auth";
import { api, DashboardData } from "@/lib/api";

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "high"
      ? "border-rose-400/15 bg-rose-500/[0.10] text-rose-100"
      : status === "low"
        ? "border-amber-300/15 bg-amber-400/[0.10] text-amber-100"
        : "border-emerald-300/15 bg-emerald-400/[0.10] text-emerald-100";

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <span className="text-emerald-300 text-lg">&uarr;</span>;
  if (trend === "down") return <span className="text-cyan-300 text-lg">&darr;</span>;
  return <span className="text-slate-500 text-lg">&rarr;</span>;
}

function SourceBadge({ source }: { source: string }) {
  const tone = source.includes("Epic")
    ? "border-violet-300/15 bg-violet-400/[0.08] text-violet-100"
    : source.includes("VA")
      ? "border-sky-300/15 bg-sky-400/[0.08] text-sky-100"
      : "border-cyan-300/15 bg-cyan-400/[0.08] text-cyan-100";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>
      {source || "Unknown source"}
    </span>
  );
}

function AlertBadge({ severity }: { severity: string }) {
  const tone =
    severity === "high"
      ? "border-rose-400/18 bg-rose-500/[0.10] text-rose-100"
      : severity === "low"
        ? "border-amber-300/18 bg-amber-400/[0.10] text-amber-100"
        : "border-cyan-300/18 bg-cyan-400/[0.10] text-cyan-100";

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] ${tone}`}>{severity}</span>;
}

function AuditIcon({ icon }: { icon: string }) {
  if (icon === "share") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100-3.182m0 3.182l8.094 4.05m-8.094-4.05a2.25 2.25 0 110 3.182m8.094 1.868a2.25 2.25 0 100-3.182m0 3.182l-8.094 4.05" />
      </svg>
    );
  }

  if (icon === "sync") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356m-.483 9.432A9 9 0 005.477 7.477M7.977 14.652H2.985v4.992m.483-9.432A9 9 0 0018.523 16.523" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
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
      .catch(() => {
        toast.error("Failed to load dashboard data");
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="flex h-[70vh] items-center justify-center">
          <div className="glass-panel rounded-[1.75rem] px-10 py-8 text-center">
            <div
              className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent"
              role="status"
              aria-label="Loading"
            />
            <div className="mt-4 text-sm text-slate-300">Booting your continuity workspace...</div>
          </div>
        </div>
      </div>
    );
  }

  const { patient, summary, vitals, lab_trends, care_alerts, data_coverage, recent_labs, audit_log } = data;
  const coverageBuckets = data_coverage.filter((item) => item.count > 0).length;
  const totalCoverage = data_coverage.reduce((acc, item) => acc + item.count, 0);
  const continuityScore = Math.min(
    99,
    Math.round(
      28 +
        Math.min(summary.connected_portals * 11, 24) +
        Math.min(summary.total_records / 2, 18) +
        coverageBuckets * 6 -
        summary.abnormal_labs * 1.5
    )
  );
  const readinessLabel =
    continuityScore >= 88 ? "handoff ready" : continuityScore >= 72 ? "mostly ready" : "needs backfill";
  const highestCoverage = [...data_coverage].sort((a, b) => b.count - a.count)[0];
  const missingCoverage = data_coverage.filter((item) => item.count === 0);
  const uniqueSources = Array.from(new Set([...patient.connected_portals, ...recent_labs.map((lab) => lab.source).filter(Boolean)]));
  const abnormalRate = recent_labs.length ? Math.round((summary.abnormal_labs / recent_labs.length) * 100) : 0;
  const topAlert = care_alerts[0];
  const nextMove = topAlert
    ? topAlert.detail
    : missingCoverage.length > 0
      ? `Backfill ${missingCoverage[0].label.toLowerCase()} records to tighten the patient story.`
      : "The record fabric is stable. Focus on reviewing share settings and outside provider access.";

  return (
    <div className="dashboard-shell min-h-screen pb-20 text-white md:pb-0">
      <Navbar />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <FadeIn>
          <section className="glass-panel panel-border-glow relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.16),transparent_55%)] lg:block" />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <span className="section-label">Continuity cockpit</span>
                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">{patient.name}</h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                      Live record fabric across portals, outside documents, labs, and access events. The dashboard now
                      surfaces what matters next instead of just listing what already happened.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="data-pill">DOB {patient.dob || "Unknown"}</span>
                  <span className="data-pill">Patient ID {patient.patient_id}</span>
                  <span className="data-pill">{patient.wearable ? `${patient.wearable} live` : "No wearable connected"}</span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: "Connected portals", value: summary.connected_portals, hint: "sources actively linked" },
                    { label: "Records in fabric", value: summary.total_records, hint: "usable nodes in the timeline" },
                    { label: "Abnormal labs", value: summary.abnormal_labs, hint: "signals worth review" },
                  ].map((item) => (
                    <div key={item.label} className="glass-panel-soft rounded-[1.5rem] p-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">{item.label}</div>
                      <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{item.value}</div>
                      <div className="mt-2 text-sm text-slate-400">{item.hint}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="glass-panel-soft metric-orb rounded-[1.75rem] p-6">
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Continuity score</div>
                  <div className="mt-4 flex items-end gap-3">
                    <div className="text-6xl font-semibold tracking-[-0.07em] text-white">{continuityScore}</div>
                    <div className="pb-3 text-sm uppercase tracking-[0.18em] text-slate-400">{readinessLabel}</div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-400"
                      style={{ width: `${continuityScore}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{nextMove}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="glass-panel-soft rounded-[1.5rem] p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Signal density</div>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{totalCoverage}</div>
                    <div className="mt-2 text-sm text-slate-400">tracked nodes across labs, meds, docs, and encounters</div>
                  </div>
                  <div className="glass-panel-soft rounded-[1.5rem] p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Packet readiness</div>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{abnormalRate}%</div>
                    <div className="mt-2 text-sm text-slate-400">of recent labs are abnormal and should be called out in a handoff</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeInStagger className="mt-6 grid gap-4 lg:grid-cols-4">
          {[
            {
              label: "Source fabric",
              value: uniqueSources.length,
              hint: "unique systems contributing data",
            },
            {
              label: "Strongest layer",
              value: highestCoverage?.label || "None",
              hint: highestCoverage ? `${highestCoverage.count} records available` : "no populated category yet",
            },
            {
              label: "Blind spots",
              value: missingCoverage.length,
              hint: missingCoverage.length > 0 ? "categories still missing from the story" : "full category coverage",
            },
            {
              label: "Wearable metrics",
              value: summary.wearable_metrics,
              hint: patient.wearable ? `streaming from ${patient.wearable}` : "no live wearable connected",
            },
          ].map((item) => (
            <FadeInStaggerItem key={item.label}>
              <div className="glass-panel-soft rounded-[1.6rem] p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/60">{item.label}</div>
                <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{item.value}</div>
                <div className="mt-2 text-sm text-slate-400">{item.hint}</div>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <FadeIn delay={0.05}>
            <section className="glass-panel rounded-[1.9rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Care radar</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">What deserves attention next</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                  {care_alerts.length} live signals
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3">
                  {care_alerts.length > 0 ? (
                    care_alerts.map((alert, index) => (
                      <div key={`${alert.title}-${index}`} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-medium text-white">{alert.title}</div>
                            <p className="mt-2 text-sm leading-7 text-slate-300">{alert.detail}</p>
                          </div>
                          <AlertBadge severity={alert.severity} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.4rem] border border-emerald-300/12 bg-emerald-400/[0.08] p-5 text-sm text-emerald-100">
                      No active care alerts. The record is calm right now.
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-cyan-300/12 bg-cyan-400/[0.07] p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">Next best move</div>
                    <p className="mt-3 text-sm leading-7 text-slate-100">{nextMove}</p>
                  </div>

                  <div className="glass-panel-soft rounded-[1.5rem] p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Quick actions</div>
                    <div className="mt-4 grid gap-3">
                      {[
                        { href: "/records", title: "Review document uploads", text: "Backfill outside reports and scanned packets." },
                        { href: "/providers", title: "Prepare provider share", text: "Control who can access this record story." },
                        { href: "/integrations", title: "Tune source connections", text: "Keep portal sync healthy and add missing systems." },
                      ].map((action) => (
                        <Link
                          key={action.href}
                          href={action.href}
                          className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]"
                        >
                          <div className="text-sm font-medium text-white">{action.title}</div>
                          <div className="mt-1 text-sm text-slate-400">{action.text}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={0.1}>
            <section className="grid gap-5">
              <div className="glass-panel rounded-[1.9rem] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Source fabric</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Where the record is coming from</h2>
                <div className="mt-5 space-y-3">
                  {uniqueSources.length > 0 ? (
                    uniqueSources.map((source) => (
                      <div key={source} className="flex items-center justify-between rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
                          <span className="text-sm text-white">{source}</span>
                        </div>
                        <span className="text-xs text-slate-400">active</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
                      No sources connected yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-[1.9rem] p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Coverage map</div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">How complete the story feels</h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                    {data_coverage.length} categories
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {data_coverage.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="font-medium text-white">{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-400"
                          style={{
                            width: `${summary.total_records > 0 ? Math.max((item.count / summary.total_records) * 100, item.count > 0 ? 6 : 0) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </FadeIn>
        </div>

        <div className="mt-6">
          <FadeIn delay={0.1}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Signal trends</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Clinical trajectories at a glance</h2>
              </div>
            </div>
          </FadeIn>

          {lab_trends.glucose.length > 0 || lab_trends.a1c.length > 0 || lab_trends.cholesterol.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {lab_trends.glucose.length > 0 && (
                <FadeIn delay={0.1}>
                  <LabChart title="Glucose (fasting)" unit="mg/dL" data={lab_trends.glucose} refMin={70} refMax={100} />
                </FadeIn>
              )}
              {lab_trends.a1c.length > 0 && (
                <FadeIn delay={0.15}>
                  <LabChart title="Hemoglobin A1c" unit="%" data={lab_trends.a1c} refMin={4.0} refMax={5.6} />
                </FadeIn>
              )}
              {lab_trends.cholesterol.length > 0 && (
                <FadeIn delay={0.2}>
                  <LabChart title="Cholesterol (total)" unit="mg/dL" data={lab_trends.cholesterol} refMax={200} />
                </FadeIn>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-[1.9rem] p-10 text-center text-sm text-slate-400">
              No lab trend data available yet.
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <FadeIn delay={0.1}>
            <section className="glass-panel rounded-[1.9rem] overflow-hidden">
              <div className="border-b border-white/8 px-6 py-5">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Lab matrix</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Recent results with provenance</h2>
              </div>

              {recent_labs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <caption className="sr-only">Recent lab results</caption>
                    <thead>
                      <tr className="border-b border-white/8 bg-white/[0.03] text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                        <th scope="col" className="px-6 py-4 font-medium">Test</th>
                        <th scope="col" className="px-6 py-4 font-medium">LOINC</th>
                        <th scope="col" className="px-6 py-4 font-medium">Result</th>
                        <th scope="col" className="px-6 py-4 font-medium">Range</th>
                        <th scope="col" className="px-6 py-4 font-medium">Status</th>
                        <th scope="col" className="px-6 py-4 font-medium">Date</th>
                        <th scope="col" className="px-6 py-4 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent_labs.map((lab, index) => (
                        <tr key={`${lab.loinc}-${lab.date}-${index}`} className="border-b border-white/6 last:border-b-0 hover:bg-white/[0.03]">
                          <td className="px-6 py-4 font-medium text-white">{lab.test}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{lab.loinc}</td>
                          <td className="px-6 py-4 text-white">
                            {lab.value} {lab.unit}
                          </td>
                          <td className="px-6 py-4 text-slate-400">{lab.range}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={lab.status} />
                          </td>
                          <td className="px-6 py-4 text-slate-400">{lab.date}</td>
                          <td className="px-6 py-4">
                            <SourceBadge source={lab.source} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-10 text-center text-sm text-slate-400">No recent lab results yet.</div>
              )}
            </section>
          </FadeIn>

          <FadeIn delay={0.12}>
            <section className="grid gap-5">
              <div className="glass-panel rounded-[1.9rem] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Vitals feed</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Daily body signals</h2>
                {vitals.length > 0 ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {vitals.map((vital) => (
                      <div key={vital.label} className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="text-sm text-slate-400">{vital.label}</div>
                        <div className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                          {vital.value}
                          <TrendIcon trend={vital.trend} />
                        </div>
                        <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{vital.period}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                    No wearable or vitals stream available yet.
                  </div>
                )}
              </div>

              <div className="glass-panel rounded-[1.9rem] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Access feed</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Who touched the record</h2>
                {audit_log.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {audit_log.map((entry, index) => (
                      <div key={`${entry.action}-${index}`} className="flex gap-3 rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-4 py-4">
                        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/15 bg-cyan-400/[0.08] text-cyan-200">
                          <AuditIcon icon={entry.icon} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{entry.action}</div>
                          <div className="mt-1 text-sm text-slate-400">by {entry.by}</div>
                        </div>
                        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{entry.when}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                    No access log entries yet.
                  </div>
                )}
              </div>
            </section>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
