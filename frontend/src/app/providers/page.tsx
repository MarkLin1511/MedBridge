"use client";

import Navbar from "@/components/Navbar";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import { useState } from "react";

const connectedProviders = [
  {
    id: 1,
    name: "Dr. Sarah Chen",
    specialty: "Primary Care",
    facility: "Bay Area Medical Group",
    portal: "Epic MyChart",
    lastAccess: "2 hours ago",
    accessLevel: "Full records",
    status: "active",
  },
  {
    id: 2,
    name: "Dr. James Wright",
    specialty: "Internal Medicine",
    facility: "VA Palo Alto Health Care",
    portal: "VA Health",
    lastAccess: "3 weeks ago",
    accessLevel: "Full records",
    status: "active",
  },
  {
    id: 3,
    name: "Dr. Raj Patel",
    specialty: "Cardiology",
    facility: "Stanford Heart Center",
    portal: "Epic MyChart",
    lastAccess: "2 days ago",
    accessLevel: "Labs & vitals only",
    status: "active",
  },
];

const pendingInvites = [
  {
    id: 4,
    name: "Dr. Maria Lopez",
    specialty: "Radiology",
    facility: "VA Palo Alto Health Care",
    portal: "VA Health",
    requestedAccess: "Imaging records",
    requestDate: "2026-02-18",
  },
];

const availablePortals = [
  { name: "Epic MyChart", doctors: "300,000+", status: "connected", color: "bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800" },
  { name: "VA Health", doctors: "150,000+", status: "connected", color: "bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800" },
  { name: "Cerner / Oracle Health", doctors: "250,000+", status: "available", color: "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800" },
  { name: "Athenahealth", doctors: "160,000+", status: "available", color: "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800" },
  { name: "Apple Health", doctors: "N/A", status: "connected", color: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  { name: "Allscripts", doctors: "180,000+", status: "available", color: "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800" },
];

export default function ProvidersPage() {
  const [revokeConfirm, setRevokeConfirm] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FadeIn>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Providers & Portals</h1>
          <p className="mt-1 text-sm text-gray-500">Manage who can access your health records and connected data sources</p>
        </FadeIn>

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <FadeIn delay={0.1}>
            <div className="mt-6">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Pending Requests</h2>
              {pendingInvites.map((invite) => (
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
                      <button className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors">
                        Approve
                      </button>
                      <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Deny
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        )}

        {/* Connected providers */}
        <FadeIn delay={0.15}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-8 mb-3">Connected Providers</h2>
        </FadeIn>
        <FadeInStagger className="space-y-3">
          {connectedProviders.map((provider) => (
            <FadeInStaggerItem key={provider.id}>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center font-semibold text-sm shrink-0">
                      {provider.name.split(" ").map((n) => n[0]).join("")}
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
                          onClick={() => setRevokeConfirm(null)}
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

        {/* Portal connections */}
        <FadeIn delay={0.1}>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-10 mb-3">Portal Connections</h2>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {availablePortals.map((portal) => (
            <FadeInStaggerItem key={portal.name}>
              <div className={`border rounded-2xl p-4 ${portal.color}`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{portal.name}</div>
                  {portal.status === "connected" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Connected
                    </span>
                  ) : (
                    <button className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors">
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
