"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { useAuth } from "@/lib/auth";
import { api, RecordItem } from "@/lib/api";
import { toast } from "sonner";

type RecordType = "all" | "lab" | "medication" | "imaging" | "visit" | "wearable" | "document";

const typeConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  lab: { label: "Lab", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-900/40", dot: "bg-teal-400" },
  medication: { label: "Rx", color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-900/40", dot: "bg-violet-400" },
  imaging: { label: "Imaging", color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-50 dark:bg-cyan-900/40", dot: "bg-cyan-400" },
  visit: { label: "Visit", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/40", dot: "bg-amber-400" },
  wearable: { label: "Wearable", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/40", dot: "bg-emerald-400" },
  document: { label: "Document", color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800", dot: "bg-slate-400" },
};

const filterOptions: { value: RecordType; label: string }[] = [
  { value: "all", label: "All Records" },
  { value: "lab", label: "Labs" },
  { value: "medication", label: "Medications" },
  { value: "imaging", label: "Imaging" },
  { value: "visit", label: "Visits" },
  { value: "wearable", label: "Wearable" },
  { value: "document", label: "Documents" },
];

const documentTypeOptions = [
  { value: "general_record", label: "General record" },
  { value: "allergy_list", label: "Allergy list" },
  { value: "billing_statement", label: "Billing statement" },
  { value: "care_plan", label: "Care plan" },
  { value: "consent_form", label: "Consent form" },
  { value: "consult_note", label: "Consult note" },
  { value: "discharge_summary", label: "Discharge summary" },
  { value: "encounter_summary", label: "Encounter summary" },
  { value: "history_and_physical", label: "History and physical" },
  { value: "imaging_report", label: "Imaging report" },
  { value: "immunization_record", label: "Immunization record" },
  { value: "insurance_document", label: "Insurance document" },
  { value: "lab_result", label: "Lab result" },
  { value: "medication_list", label: "Medication list" },
  { value: "operative_note", label: "Operative note" },
  { value: "pathology_report", label: "Pathology report" },
  { value: "prior_authorization", label: "Prior authorization" },
  { value: "problem_list", label: "Problem list" },
  { value: "progress_note", label: "Progress note" },
  { value: "referral_note", label: "Referral note" },
  { value: "therapy_note", label: "Therapy note" },
  { value: "vitals_sheet", label: "Vitals sheet" },
  { value: "wearable_report", label: "Wearable report" },
];

const sourceSystemSuggestions = [
  "Epic MyChart",
  "Oracle Cerner",
  "eClinicalWorks",
  "athenahealth",
  "MEDITECH",
  "NextGen",
  "Allscripts / Veradigm",
  "Practice Fusion",
  "VA Health",
  "Surescripts",
  "DrChrono",
];

function formatClassification(value: string | null) {
  if (!value) return null;
  return value.replace(/_/g, " ");
}

const samplePdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 114 >>
stream
BT
/F1 18 Tf
72 720 Td
(MedBridge Sample Referral Summary) Tj
0 -28 Td
/F1 12 Tf
(Patient: Marcus Johnson) Tj
0 -20 Td
(Referring provider: Dr. Sarah Chen) Tj
0 -20 Td
(Reason: Cardiology follow-up after elevated A1c and cholesterol.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000122 00000 n 
0000000248 00000 n 
0000000318 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
525
%%EOF`;

function buildSampleDocumentFile() {
  return new File([samplePdfContent], "medbridge-sample-referral-summary.pdf", {
    type: "application/pdf",
  });
}

export default function RecordsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<RecordType>("all");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    source_system: "eClinicalWorks",
    source: "",
    facility: "",
    provider: "",
    document_date: new Date().toISOString().slice(0, 10),
    record_type: "general_record",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query with 300ms delay
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    api
      .records(filter, debouncedSearch, 0, 50)
      .then(setRecords)
      .catch(() => toast.error("Failed to load records"))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, filter, debouncedSearch]);

  const refreshRecords = async () => {
    setLoading(true);
    try {
      const next = await api.records(filter, debouncedSearch, 0, 50);
      setRecords(next);
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const uploadDocumentFile = async (file: File, formData = uploadForm) => {
    await api.uploadDocument({
      file,
      ...formData,
      title: formData.title.trim() || file.name,
    });
    setSelectedFile(null);
    setUploadForm((current) => ({
      ...current,
      title: "",
      source_system: "eClinicalWorks",
      source: "",
      facility: "",
      provider: "",
      record_type: "general_record",
    }));
    await refreshRecords();
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Choose a PDF or image to upload");
      return;
    }
    setUploading(true);
    try {
      await uploadDocumentFile(selectedFile);
      toast.success("Document uploaded to your record timeline");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload document";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSampleDocument = async () => {
    setUploading(true);
    try {
      await uploadDocumentFile(buildSampleDocumentFile(), {
        title: "Sample referral summary",
        source_system: "eClinicalWorks",
        source: "MedBridge Demo",
        facility: "Bay Area Family Practice",
        provider: "Dr. Sarah Chen",
        document_date: new Date().toISOString().slice(0, 10),
        record_type: "referral_note",
      });
      toast.success("Sample document uploaded successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload sample document";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (record: RecordItem) => {
    if (!record.download_url) return;
    try {
      const blob = await api.downloadDocument(record.download_url);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${record.title.replace(/\s+/g, "_").toLowerCase() || "medical_document"}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download original document");
    }
  };

  const handleExport = async () => {
    setShowExportConfirm(false);
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
      toast.success("Records exported successfully");
    } catch {
      toast.error("Failed to export records");
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || (loading && records.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" role="status" />
            <span className="text-sm text-gray-500">Loading records...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Medical Records</h1>
              <p className="mt-1 text-sm text-gray-500">Complete timeline across all connected portals and devices</p>
            </div>
            <div className="relative shrink-0">
              <button
                onClick={() => setShowExportConfirm(true)}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {exporting ? "Exporting..." : "Export FHIR R4"}
              </button>

              {showExportConfirm && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-4 z-50">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Export all records as FHIR R4 JSON? This will include all your medical data.
                  </p>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => setShowExportConfirm(false)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExport}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                    >
                      Confirm Export
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.03}>
          <form
            onSubmit={handleUploadDocument}
            className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload medical documents</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add PDFs, screenshots, or scanned records and tag them with the right source metadata.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Document file</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-3 py-3 text-sm text-gray-600 dark:text-gray-300"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Document title</span>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(event) => setUploadForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Annual physical summary"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Source system</span>
                <input
                  type="text"
                  value={uploadForm.source_system}
                  onChange={(event) => setUploadForm((current) => ({ ...current, source_system: event.target.value }))}
                  placeholder="eClinicalWorks"
                  list="source-system-suggestions"
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <datalist id="source-system-suggestions">
                  {sourceSystemSuggestions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Portal or source label</span>
                <input
                  type="text"
                  value={uploadForm.source}
                  onChange={(event) => setUploadForm((current) => ({ ...current, source: event.target.value }))}
                  placeholder="Downtown Cardiology eCW portal"
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Facility or practice</span>
                <input
                  type="text"
                  value={uploadForm.facility}
                  onChange={(event) => setUploadForm((current) => ({ ...current, facility: event.target.value }))}
                  placeholder="Bay Area Family Practice"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</span>
                <input
                  type="text"
                  value={uploadForm.provider}
                  onChange={(event) => setUploadForm((current) => ({ ...current, provider: event.target.value }))}
                  placeholder="Dr. Sarah Chen"
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Document date</span>
                <input
                  type="date"
                  value={uploadForm.document_date}
                  onChange={(event) => setUploadForm((current) => ({ ...current, document_date: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Record type</span>
                <select
                  value={uploadForm.record_type}
                  onChange={(event) => setUploadForm((current) => ({ ...current, record_type: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {documentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-400">
                Supported files: PDF, PNG, JPG, WEBP, HEIC, TIFF. Maximum size: 8 MB. MedBridge now stores the EHR/vendor, source label, facility, document kind, and extraction profile so later OCR can branch for layouts like eClinicalWorks, Epic, Cerner, athenahealth, and generic scans.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleUploadSampleDocument}
                  disabled={uploading}
                  className="inline-flex items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100 disabled:opacity-50 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300"
                >
                  {uploading ? "Uploading..." : "Upload sample file"}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload document"}
                </button>
              </div>
            </div>
          </form>
        </FadeIn>

        {/* Search Bar */}
        <FadeIn delay={0.05}>
          <div className="mt-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Search medical records"
              />
            </div>
          </div>
        </FadeIn>

        {/* Filters */}
        <FadeIn delay={0.1}>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                aria-label={`Filter by ${opt.label}`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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
            {records.map((record) => {
              const config = typeConfig[record.type] || typeConfig.lab;
              return (
                <FadeInStaggerItem key={record.id}>
                  <div className="relative pl-10 sm:pl-14">
                    <div className={`absolute left-2.5 sm:left-4.5 top-5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-950 ${config.dot}`} />

                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400">{record.date}</span>
                        <span className="text-xs text-gray-400">&middot;</span>
                        <span className="text-xs text-gray-500">{record.source}</span>
                        {record.source_system && (
                          <>
                            <span className="text-xs text-gray-400">&middot;</span>
                            <span className="text-xs text-gray-500">{record.source_system}</span>
                          </>
                        )}
                        {record.classification && (
                          <>
                            <span className="text-xs text-gray-400">&middot;</span>
                            <span className="text-xs text-gray-500 capitalize">{formatClassification(record.classification)}</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{record.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{record.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">{record.provider}</span>
                        {record.facility && <span className="text-xs text-gray-500">{record.facility}</span>}
                        {record.flags.map((flag) => (
                          <span key={flag} className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                            {flag}
                          </span>
                        ))}
                        {record.extraction_profile && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                            Profile: {record.extraction_profile}
                          </span>
                        )}
                        {record.download_url && (
                          <button
                            type="button"
                            onClick={() => handleDownloadDocument(record)}
                            className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            Download original
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeInStaggerItem>
              );
            })}
          </FadeInStagger>

          {records.length === 0 && !loading && (
            <div className="text-center py-16">
              <svg className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No records found</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
