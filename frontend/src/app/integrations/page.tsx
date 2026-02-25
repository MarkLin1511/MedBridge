"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { useAuth } from "@/lib/auth";
import { api, FHIRConnection, FhirSyncHistoryItem } from "@/lib/api";
import { toast } from "sonner";

function ButtonSpinner() {
  return (
    <span
      role="status"
      className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5"
      aria-label="Loading"
    />
  );
}

const EHR_OPTIONS = [
  {
    key: "epic",
    name: "Epic MyChart",
    description: "Connect to Epic-powered health systems via MyChart patient portal.",
    color: "bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800",
    iconBg: "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300",
  },
  {
    key: "cerner",
    name: "Cerner / Oracle Health",
    description: "Connect to Cerner-powered facilities and Oracle Health systems.",
    color: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    iconBg: "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300",
  },
  {
    key: "custom",
    name: "Custom FHIR Server",
    description: "Connect to any FHIR R4-compliant server using a base URL.",
    color: "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
    iconBg: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  },
];

export default function IntegrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [connections, setConnections] = useState<FHIRConnection[]>([]);
  const [syncHistory, setSyncHistory] = useState<FhirSyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customFhirUrl, setCustomFhirUrl] = useState("");
  const [connectingEhr, setConnectingEhr] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [id: number]: string }>({});
  const [confirmDisconnect, setConfirmDisconnect] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [conns, history] = await Promise.all([
        api.fhirConnections(),
        api.fhirSyncHistory(),
      ]);
      setConnections(conns);
      setSyncHistory(history);
    } catch {
      toast.error("Failed to load FHIR connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
  }, [user, authLoading, router, loadData]);

  const handleConnect = async (ehrKey: string) => {
    if (ehrKey === "custom" && !customFhirUrl.trim()) {
      toast.error("Please enter a FHIR server base URL");
      return;
    }
    setConnectingEhr(ehrKey);
    try {
      const { authorize_url } = await api.fhirAuthorize(
        ehrKey,
        ehrKey === "custom" ? customFhirUrl.trim() : undefined
      );
      window.location.href = authorize_url;
    } catch {
      toast.error("Failed to initiate EHR connection");
      setConnectingEhr(null);
    }
  };

  const handleSync = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "sync" }));
    try {
      const result = await api.fhirSync(id);
      toast.success(result.message || "Sync started successfully");
      loadData();
    } catch {
      toast.error("Failed to sync records");
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDisconnect = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "disconnect" }));
    try {
      await api.fhirDisconnect(id);
      setConfirmDisconnect(null);
      toast.success("EHR disconnected");
      loadData();
    } catch {
      toast.error("Failed to disconnect EHR");
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div role="status" className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading integrations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FadeIn>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FHIR Integrations</h1>
          <p className="mt-1 text-sm text-gray-500">Connect to EHR systems and manage health data sync via FHIR</p>
        </FadeIn>

        {/* Connect to EHR */}
        <FadeIn delay={0.1}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-8 mb-3">Connect to EHR</h2>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EHR_OPTIONS.map((ehr) => (
            <FadeInStaggerItem key={ehr.key}>
              <div className={`border rounded-2xl p-5 ${ehr.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ehr.iconBg}`}>
                    {ehr.key === "epic" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    )}
                    {ehr.key === "cerner" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                      </svg>
                    )}
                    {ehr.key === "custom" && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{ehr.name}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{ehr.description}</p>

                {ehr.key === "custom" && (
                  <input
                    type="url"
                    placeholder="https://fhir.example.com/r4"
                    value={customFhirUrl}
                    onChange={(e) => setCustomFhirUrl(e.target.value)}
                    className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                )}

                <button
                  onClick={() => handleConnect(ehr.key)}
                  disabled={connectingEhr === ehr.key}
                  className="w-full px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
                >
                  {connectingEhr === ehr.key && <ButtonSpinner />}
                  Connect
                </button>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>

        {/* Active Connections */}
        <FadeIn delay={0.15}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-10 mb-3">Active Connections</h2>
        </FadeIn>
        {connections.length === 0 ? (
          <FadeIn delay={0.2}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No EHR systems connected yet. Use the cards above to connect.</p>
            </div>
          </FadeIn>
        ) : (
          <FadeInStagger className="space-y-3">
            {connections.map((conn) => (
              <FadeInStaggerItem key={conn.id}>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center font-semibold text-sm shrink-0">
                        {conn.ehr_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{conn.ehr_name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 break-all">{conn.fhir_base_url}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              conn.status === "active"
                                ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {conn.status === "active" ? "Active" : "Expired"}
                          </span>
                          <span className="text-xs text-gray-400">
                            Last synced: {conn.last_synced_at ? new Date(conn.last_synced_at).toLocaleString() : "Never"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={!!actionLoading[conn.id]}
                        className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                      >
                        {actionLoading[conn.id] === "sync" && <ButtonSpinner />}
                        Sync Now
                      </button>
                      {confirmDisconnect === conn.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDisconnect(conn.id)}
                            disabled={actionLoading[conn.id] === "disconnect"}
                            aria-label={`Confirm disconnect ${conn.ehr_name}`}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                          >
                            {actionLoading[conn.id] === "disconnect" && <ButtonSpinner />}
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDisconnect(null)}
                            aria-label={`Cancel disconnecting ${conn.ehr_name}`}
                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDisconnect(conn.id)}
                          aria-label={`Disconnect ${conn.ehr_name}`}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        )}

        {/* Sync History */}
        <FadeIn delay={0.2}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-10 mb-3">Sync History</h2>
        </FadeIn>
        {syncHistory.length === 0 ? (
          <FadeIn delay={0.25}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No sync activity yet.</p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.25}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {syncHistory.map((item) => (
                  <div key={item.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.status === "success"
                            ? "bg-emerald-500"
                            : item.status === "failed"
                            ? "bg-red-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.action}</div>
                        <div className="text-xs text-gray-500">{item.ehr_name}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">{item.when}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
