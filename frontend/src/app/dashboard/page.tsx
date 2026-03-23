"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Navbar from "@/components/Navbar";
import LabChart from "@/components/LabChart";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { useAuth } from "@/lib/auth";
import { api, DashboardData, ManualLabEntryData } from "@/lib/api";

type ManualLabFormState = Omit<ManualLabEntryData, "value"> & {
  value: number | string;
};

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "high" || status === "attention"
      ? "border-rose-400/15 bg-rose-500/[0.10] text-rose-100"
      : status === "low"
        ? "border-amber-300/15 bg-amber-400/[0.10] text-amber-100"
        : status === "missing"
          ? "border-slate-300/12 bg-slate-400/[0.08] text-slate-300"
          : "border-emerald-300/15 bg-emerald-400/[0.10] text-emerald-100";

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <span className="text-emerald-300 text-lg">&uarr;</span>;
  if (trend === "down") return <span className="text-rose-300 text-lg">&darr;</span>;
  return <span className="text-slate-500 text-lg">&rarr;</span>;
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

  if (icon === "download") {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

const defaultLabForm: ManualLabFormState = {
  test_name: "Hemoglobin A1c",
  value: "",
  unit: "%",
  ref_range: "4.0-5.6",
  source: "Manual entry",
  collected_on: new Date().toISOString().slice(0, 10),
};

const commonLabSuggestions = [
  "Hemoglobin A1c",
  "Glucose (fasting)",
  "Cholesterol (total)",
  "LDL cholesterol",
  "HDL cholesterol",
  "Triglycerides",
  "Creatinine",
  "TSH",
];

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function formatConfidence(value: number | null | undefined) {
  if (typeof value !== "number") return null;
  return `${Math.round(value * 100)}% confidence`;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [savingLab, setSavingLab] = useState(false);
  const [labForm, setLabForm] = useState(defaultLabForm);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const next = await api.dashboard();
      setData(next);
    } catch {
      toast.error("Failed to load dashboard data");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    void loadDashboard();
  }, [user, authLoading, router, loadDashboard]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const bundle = await api.exportFhir();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/fhir+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medbridge_fhir_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("FHIR translation packet downloaded");
      await loadDashboard();
    } catch {
      toast.error("Failed to export FHIR packet");
    } finally {
      setExporting(false);
    }
  };

  const handleManualLabSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericValue = Number(labForm.value);
    if (!Number.isFinite(numericValue)) {
      toast.error("Enter a valid numeric lab value");
      return;
    }

    setSavingLab(true);
    try {
      await api.createManualLabEntry({
        test_name: labForm.test_name,
        value: numericValue,
        unit: labForm.unit,
        ref_range: labForm.ref_range,
        source: labForm.source,
        collected_on: labForm.collected_on,
      });
      toast.success("Lab added to your quantified dashboard");
      setLabForm(defaultLabForm);
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save lab entry";
      toast.error(message);
    } finally {
      setSavingLab(false);
    }
  };

  if (authLoading || loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="flex h-[70vh] items-center justify-center">
          <div className="glass-panel rounded-[1.75rem] px-10 py-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" role="status" aria-label="Loading" />
            <div className="mt-4 text-sm text-slate-300">Booting your quantified health cockpit...</div>
          </div>
        </div>
      </div>
    );
  }

  const { patient, summary, quantified_overview, health_axes, lab_trends, care_alerts, recent_labs, ingestion, translation, audit_log } = data;
  const missingAxes = health_axes.filter((axis) => axis.metrics.some((metric) => metric.status === "missing")).length;

  return (
    <div className="dashboard-shell min-h-screen pb-20 text-white md:pb-0">
      <Navbar />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <FadeIn>
          <section className="glass-panel panel-border-glow relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.16),transparent_55%)] lg:block" />
            <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="section-label">Quantified self command center</span>
                <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                  Your body signals and clinical records finally live on the same dashboard.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  MedBridge is not just a portal mirror. It fuses wearables, typed labs, hospital uploads, and AI-scraped outside documents into a usable whole-health operating surface.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="data-pill">DOB {patient.dob || "Unknown"}</span>
                  <span className="data-pill">Patient ID {patient.patient_id}</span>
                  <span className="data-pill">{patient.wearable ? `${patient.wearable} streaming` : "No wearable connected"}</span>
                  <span className="data-pill">{summary.connected_portals} clinical portals linked</span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Quant score", value: quantified_overview.score, hint: quantified_overview.mode },
                    { label: "Uploaded docs", value: summary.uploaded_documents, hint: "hospital + portal files" },
                    { label: "Pending AI reviews", value: summary.pending_reviews, hint: "documents not yet landed" },
                    { label: "Typed labs", value: summary.manual_lab_entries, hint: "patient-entered results" },
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
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Whole-health narrative</div>
                  <div className="mt-4 flex items-end gap-3">
                    <div className="text-6xl font-semibold tracking-[-0.07em] text-white">{quantified_overview.score}</div>
                    <div className="pb-3 text-sm uppercase tracking-[0.18em] text-slate-400">{quantified_overview.mode}</div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-400"
                      style={{ width: `${quantified_overview.score}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{quantified_overview.narrative}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="glass-panel-soft rounded-[1.5rem] p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Blind spots</div>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{missingAxes}</div>
                    <div className="mt-2 text-sm text-slate-400">body systems still missing at least one signal</div>
                  </div>
                  <div className="glass-panel-soft rounded-[1.5rem] p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Export readiness</div>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{translation.exportable_resources}</div>
                    <div className="mt-2 text-sm text-slate-400">resources ready for FHIR translation</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        <FadeInStagger className="mt-6 grid gap-4 xl:grid-cols-4">
          {health_axes.map((axis) => (
            <FadeInStaggerItem key={axis.slug}>
              <section className="glass-panel-soft rounded-[1.6rem] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/60">{axis.label}</div>
                    <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">{axis.score}</div>
                  </div>
                  <TrendIcon trend={axis.trend} />
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{axis.summary}</p>
                <div className="mt-4 space-y-2">
                  {axis.metrics.map((metric) => (
                    <div key={`${axis.slug}-${metric.label}`} className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-300">{metric.label}</span>
                        <StatusBadge status={metric.status} />
                      </div>
                      <div className="mt-2 text-sm font-medium text-white">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </section>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <FadeIn delay={0.05}>
            <section className="glass-panel rounded-[1.9rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Manual capture</div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Type a lab result directly into the dashboard</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    This is the quantified-self layer for results that arrive before an upload, outside a portal, or straight from a clinician conversation.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                  {summary.manual_lab_entries} typed so far
                </div>
              </div>

              <form onSubmit={handleManualLabSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-300">Test name</span>
                  <input
                    type="text"
                    value={labForm.test_name}
                    onChange={(event) => setLabForm((current) => ({ ...current, test_name: event.target.value }))}
                    list="dashboard-lab-suggestions"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="dashboard-lab-suggestions">
                    {commonLabSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-300">Value</span>
                  <input
                    type="number"
                    step="0.1"
                    value={labForm.value}
                    onChange={(event) => setLabForm((current) => ({ ...current, value: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-300">Unit</span>
                  <input
                    type="text"
                    value={labForm.unit}
                    onChange={(event) => setLabForm((current) => ({ ...current, unit: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-300">Reference range</span>
                  <input
                    type="text"
                    value={labForm.ref_range}
                    onChange={(event) => setLabForm((current) => ({ ...current, ref_range: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-300">Source</span>
                  <input
                    type="text"
                    value={labForm.source}
                    onChange={(event) => setLabForm((current) => ({ ...current, source: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-300">Collected on</span>
                  <input
                    type="date"
                    value={labForm.collected_on}
                    onChange={(event) => setLabForm((current) => ({ ...current, collected_on: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>

                <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-400">
                    Manually typed labs still become part of the quantified dashboard, the clinical trend lines, and the future FHIR handoff packet.
                  </p>
                  <button
                    type="submit"
                    disabled={savingLab}
                    className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                  >
                    {savingLab ? "Saving..." : "Add lab to dashboard"}
                  </button>
                </div>
              </form>
            </section>
          </FadeIn>

          <FadeIn delay={0.08}>
            <section className="grid gap-5">
              <div className="glass-panel rounded-[1.9rem] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Document intelligence</div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Portal documents into quantified signals</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Upload one hospital or portal document, let AI scrape it, review the draft, and then let it reshape the dashboard instead of sitting as a dead PDF.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                    {ingestion.pending_reviews} waiting
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Uploaded docs", value: ingestion.uploaded_documents, hint: "files from portals and hospitals" },
                    { label: "Approved imports", value: ingestion.approved_document_imports, hint: "already shaping the dashboard" },
                    { label: "Pending AI review", value: ingestion.pending_reviews, hint: "needs human confirmation" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                      <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{item.value}</div>
                      <div className="mt-2 text-sm text-slate-400">{item.hint}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3">
                  {ingestion.recent_documents.length > 0 ? (
                    ingestion.recent_documents.map((document) => (
                      <div key={document.id} className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-white">{document.title}</span>
                          <StatusBadge status={formatStatus(document.status)} />
                          {formatConfidence(document.review_confidence) && (
                            <span className="text-xs text-slate-400">{formatConfidence(document.review_confidence)}</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-300">
                          {document.review_summary || `${document.source_system} · ${document.source}`}
                        </p>
                        <div className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {document.date} · {document.derived_records_count} items landed
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                      No uploaded documents yet.
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link href="/records" className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]">
                    <div className="text-sm font-medium text-white">Open document review</div>
                    <div className="mt-1 text-sm text-slate-400">Approve AI drafts and push them into the dashboard.</div>
                  </Link>
                  <Link href="/records" className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]">
                    <div className="text-sm font-medium text-white">Upload new portal packet</div>
                    <div className="mt-1 text-sm text-slate-400">Bring in PDFs, screenshots, discharge paperwork, and summaries.</div>
                  </Link>
                </div>
              </div>

              <div className="glass-panel rounded-[1.9rem] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Translation layer</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Download this health state into another system</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{translation.narrative}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Exportable resources</div>
                    <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{translation.exportable_resources}</div>
                    <div className="mt-2 text-sm text-slate-400">labs, records, and approved document intelligence</div>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Last FHIR export</div>
                    <div className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">{translation.last_exported_at || "Not yet exported"}</div>
                    <div className="mt-2 text-sm text-slate-400">{translation.supported_formats.join(" · ")}</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                  >
                    {exporting ? "Exporting..." : "Download FHIR translation packet"}
                  </button>
                  <Link
                    href="/records"
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
                  >
                    Review source documents first
                  </Link>
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
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Lab trajectories over time</h2>
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

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <FadeIn delay={0.12}>
            <section className="glass-panel rounded-[1.9rem] overflow-hidden">
              <div className="border-b border-white/8 px-6 py-5">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Clinical matrix</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Recent lab results with provenance</h2>
              </div>

              {recent_labs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-white/8 bg-white/[0.03] text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                        <th className="px-6 py-4 font-medium">Test</th>
                        <th className="px-6 py-4 font-medium">Result</th>
                        <th className="px-6 py-4 font-medium">Range</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent_labs.map((lab, index) => (
                        <tr key={`${lab.test}-${lab.date}-${index}`} className="border-b border-white/6 last:border-b-0 hover:bg-white/[0.03]">
                          <td className="px-6 py-4 font-medium text-white">{lab.test}</td>
                          <td className="px-6 py-4 text-white">
                            {lab.value} {lab.unit}
                          </td>
                          <td className="px-6 py-4 text-slate-400">{lab.range}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={lab.status} />
                          </td>
                          <td className="px-6 py-4 text-slate-400">{lab.date}</td>
                          <td className="px-6 py-4 text-slate-300">{lab.source}</td>
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

          <FadeIn delay={0.14}>
            <section className="grid gap-5">
              <div className="glass-panel rounded-[1.9rem] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Care radar</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">What deserves attention next</h2>
                <div className="mt-5 space-y-3">
                  {care_alerts.length > 0 ? (
                    care_alerts.map((alert, index) => (
                      <div key={`${alert.title}-${index}`} className="rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-medium text-white">{alert.title}</div>
                            <p className="mt-2 text-sm leading-7 text-slate-300">{alert.detail}</p>
                          </div>
                          <StatusBadge status={alert.severity} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.3rem] border border-emerald-300/12 bg-emerald-400/[0.08] p-5 text-sm text-emerald-100">
                      No active care alerts right now.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-[1.9rem] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Source mix</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Where your health graph is being fed from</h2>
                <div className="mt-5 space-y-4">
                  {ingestion.source_mix.map((source) => (
                    <div key={source.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-300">{source.label}</span>
                        <span className="font-medium text-white">{source.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-400"
                          style={{ width: `${Math.max((source.count / Math.max(summary.total_records + summary.uploaded_documents, 1)) * 100, 8)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-[1.9rem] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Access feed</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Recent activity</h2>
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
