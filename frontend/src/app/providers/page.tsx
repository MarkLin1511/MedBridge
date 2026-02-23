"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { api, ProviderData, PortalData } from "@/lib/api";

export default function ProvidersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderData | null>(null);
  const [portals, setPortals] = useState<PortalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeConfirm, setRevokeConfirm] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [prov, port] = await Promise.all([api.providers(), api.portals()]);
      setProviders(prov);
      setPortals(port);
    } catch {
      // silently fail
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
    await api.approveProvider(id);
    loadData();
  };

  const handleDeny = async (id: number) => {
    await api.denyProvider(id);
    loadData();
  };

  const handleRevoke = async (id: number) => {
    await api.revokeProvider(id);
    setRevokeConfirm(null);
    loadData();
  };

  const handleConnectPortal = async (id: number) => {
    await api.connectPortal(id);
    loadData();
  };

  const handleDisconnectPortal = async (id: number) => {
    await api.disconnectPortal(id);
    loadData();
  };

  if (authLoading || loading || !providers) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
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
        {providers.pending.length > 0 && (
          <FadeIn delay={0.1}>
            <div className="mt-6">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Pending Requests</h2>
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
                          className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDeny(invite.id)}
                          className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Connected providers */}
        <FadeIn delay={0.15}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-8 mb-3">Connected Providers</h2>
        </FadeIn>
        {providers.connected.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No connected providers yet.</div>
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
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Confirm revoke
                          </button>
                          <button
                            onClick={() => setRevokeConfirm(null)}
                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRevokeConfirm(provider.id)}
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
                      <button
                        onClick={() => handleDisconnectPortal(portal.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnectPortal(portal.id)}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
                <div className="text-xs mt-1 opacity-70">{portal.doctors} providers in network</div>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </div>
  );
}
