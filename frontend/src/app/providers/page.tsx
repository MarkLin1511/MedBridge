"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { api, ProviderData, PortalData } from "@/lib/api";
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

export default function ProvidersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderData | null>(null);
  const [portals, setPortals] = useState<PortalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeConfirm, setRevokeConfirm] = useState<number | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [id: number]: string }>({});

  const loadData = useCallback(async () => {
    try {
      const [prov, port] = await Promise.all([api.providers(), api.portals()]);
      setProviders(prov);
      setPortals(port);
    } catch {
      toast.error("Failed to load providers");
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

  const handleApprove = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "approve" }));
    try {
      await api.approveProvider(id);
      toast.success("Provider approved");
      loadData();
    } catch {
      toast.error("Failed to approve provider");
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDeny = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "deny" }));
    try {
      await api.denyProvider(id);
      toast.success("Provider denied");
      loadData();
    } catch {
      toast.error("Failed to deny provider");
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleRevoke = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "revoke" }));
    try {
      await api.revokeProvider(id);
      setRevokeConfirm(null);
      toast.success("Provider access revoked");
      loadData();
    } catch {
      toast.error("Failed to revoke provider access");
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleConnectPortal = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "connect" }));
    try {
      await api.connectPortal(id);
      toast.success("Portal connected");
      loadData();
    } catch {
      toast.error("Failed to connect portal");
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDisconnectPortal = async (id: number) => {
    setActionLoading((prev) => ({ ...prev, [id]: "disconnect" }));
    try {
      await api.disconnectPortal(id);
      setConfirmDisconnect(null);
      toast.success("Portal disconnected");
      loadData();
    } catch {
      toast.error("Failed to disconnect portal");
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  if (authLoading || loading || !providers) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div role="status" className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading providers...</span>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Providers & Portals</h1>
          <p className="mt-1 text-sm text-gray-500">Manage who can access your health records and connected data sources</p>
        </FadeIn>

        {/* Pending invites */}
        <FadeIn delay={0.1}>
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Pending Requests</h2>
            {providers.pending.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-green-400 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">No pending access requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.pending.map((invite) => (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{invite.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{invite.specialty} &middot; {invite.facility}</div>
                        <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">Requesting access to: {invite.requestedAccess}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(invite.id)}
                          disabled={actionLoading[invite.id] === "approve"}
                          aria-label={`Approve ${invite.name}'s access request`}
                          className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                        >
                          {actionLoading[invite.id] === "approve" && <ButtonSpinner />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeny(invite.id)}
                          disabled={actionLoading[invite.id] === "deny"}
                          aria-label={`Deny ${invite.name}'s access request`}
                          className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                        >
                          {actionLoading[invite.id] === "deny" && <ButtonSpinner />}
                          Deny
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Connected providers */}
        <FadeIn delay={0.15}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-8 mb-3">Connected Providers</h2>
        </FadeIn>
        {providers.connected.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No providers have access to your records yet.</p>
          </div>
        ) : (
          <FadeInStagger className="space-y-3">
            {providers.connected.map((provider) => (
              <FadeInStaggerItem key={provider.id}>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center font-semibold text-sm shrink-0">
                        {provider.name.split(" ").filter(n => n.startsWith("D") || n === n.charAt(0).toUpperCase() + n.slice(1)).map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{provider.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{provider.specialty} &middot; {provider.facility}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            {provider.accessLevel}
                          </span>
                          <span className="text-xs text-gray-400">via {provider.portal}</span>
                          <span className="text-xs text-gray-400">&middot; Last access: {provider.lastAccess}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {revokeConfirm === provider.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRevoke(provider.id)}
                            disabled={actionLoading[provider.id] === "revoke"}
                            aria-label={`Confirm revoke ${provider.name}'s access`}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                          >
                            {actionLoading[provider.id] === "revoke" && <ButtonSpinner />}
                            Confirm revoke
                          </button>
                          <button
                            onClick={() => setRevokeConfirm(null)}
                            aria-label={`Cancel revoking ${provider.name}'s access`}
                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRevokeConfirm(provider.id)}
                          aria-label={`Revoke ${provider.name}'s access`}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        >
                          Revoke access
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        )}

        {/* Portal connections */}
        <FadeIn delay={0.1}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-10 mb-3">Portal Connections</h2>
        </FadeIn>
        {portals.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No portal connections available.</p>
          </div>
        ) : (
          <FadeInStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {portals.map((portal) => (
              <FadeInStaggerItem key={portal.id}>
                <div className={`border rounded-2xl p-4 ${portal.color || "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{portal.name}</div>
                    {portal.status === "connected" ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Connected
                        </span>
                        {confirmDisconnect === portal.id ? (
                          <span className="flex items-center gap-1.5">
                            <button
                              onClick={() => setConfirmDisconnect(null)}
                              aria-label={`Cancel disconnecting from ${portal.name}`}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDisconnectPortal(portal.id)}
                              disabled={actionLoading[portal.id] === "disconnect"}
                              aria-label={`Confirm disconnect from ${portal.name}`}
                              className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                            >
                              {actionLoading[portal.id] === "disconnect" && <ButtonSpinner />}
                              Disconnect
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDisconnect(portal.id)}
                            aria-label={`Disconnect from ${portal.name}`}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnectPortal(portal.id)}
                        disabled={actionLoading[portal.id] === "connect"}
                        aria-label={`Connect to ${portal.name}`}
                        className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center"
                      >
                        {actionLoading[portal.id] === "connect" && <ButtonSpinner />}
                        Connect
                      </button>
                    )}
                  </div>
                  {confirmDisconnect === portal.id && portal.status === "connected" && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Disconnect from {portal.name}? You&apos;ll lose access to records from this portal.
                    </div>
                  )}
                  <div className="text-xs mt-1 opacity-70">{portal.doctors} providers in network</div>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        )}
      </div>
    </div>
  );
}
