"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { FadeIn } from "@/components/AnimatedSection";
import { useAuth } from "@/lib/auth";
import { api, SettingsData } from "@/lib/api";

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    api
      .getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.updateSettings({
        first_name: settings.profile.first_name,
        last_name: settings.profile.last_name,
        email: settings.profile.email,
        dob: settings.profile.dob,
        two_factor_enabled: settings.security.two_factor_enabled,
        session_timeout: settings.security.session_timeout,
        share_labs: settings.privacy.share_labs,
        share_wearable: settings.privacy.share_wearable,
        allow_export: settings.privacy.allow_export,
        require_approval: settings.privacy.require_approval,
        notify_labs: settings.notifications.notify_labs,
        notify_provider_requests: settings.notifications.notify_provider_requests,
        notify_wearable_sync: settings.notifications.notify_wearable_sync,
        notify_weekly_summary: settings.notifications.notify_weekly_summary,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: string, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, profile: { ...settings.profile, [field]: value } });
  };

  const togglePrivacy = (field: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      privacy: { ...settings.privacy, [field]: !settings.privacy[field as keyof typeof settings.privacy] },
    });
  };

  const toggleSecurity = (field: string, value: boolean | number) => {
    if (!settings) return;
    setSettings({ ...settings, security: { ...settings.security, [field]: value } });
  };

  const updateNotification = (field: string, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, notifications: { ...settings.notifications, [field]: value } });
  };

  if (authLoading || loading || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  const notifyOptions = [
    { value: "email_push", label: "Email + Push" },
    { value: "email", label: "Email" },
    { value: "push", label: "Push only" },
    { value: "off", label: "Off" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FadeIn>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account, security, and data preferences</p>
        </FadeIn>

        <div className="mt-8 space-y-8">
          {/* Profile */}
          <FadeIn delay={0.1}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Profile</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Full name</label>
                  <div className="flex gap-2 w-full sm:w-64">
                    <input type="text" value={settings.profile.first_name} onChange={(e) => updateProfile("first_name", e.target.value)} className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    <input type="text" value={settings.profile.last_name} onChange={(e) => updateProfile("last_name", e.target.value)} className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" value={settings.profile.email} onChange={(e) => updateProfile("email", e.target.value)} className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Date of birth</label>
                  <input type="date" value={settings.profile.dob || ""} onChange={(e) => updateProfile("dob", e.target.value)} className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                </div>
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Patient ID</label>
                  <span className="text-sm text-gray-500 font-mono">{settings.profile.patient_id}</span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Security */}
          <FadeIn delay={0.2}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Security</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Two-factor authentication</label>
                  <button
                    onClick={() => toggleSecurity("two_factor_enabled", !settings.security.two_factor_enabled)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${settings.security.two_factor_enabled ? "bg-teal-600" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.security.two_factor_enabled ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Session timeout</label>
                  <select
                    value={settings.security.session_timeout}
                    onChange={(e) => toggleSecurity("session_timeout", parseInt(e.target.value))}
                    className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg border-0 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Privacy & Data Sharing */}
          <FadeIn delay={0.3}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Privacy & Data Sharing</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { key: "share_labs", label: "Share lab results with providers" },
                  { key: "share_wearable", label: "Share wearable data" },
                  { key: "allow_export", label: "Allow data export (FHIR)" },
                  { key: "require_approval", label: "Require approval for new provider access" },
                ].map((item) => (
                  <div key={item.key} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">{item.label}</label>
                    <button
                      onClick={() => togglePrivacy(item.key)}
                      className={`w-9 h-5 rounded-full relative transition-colors ${
                        settings.privacy[item.key as keyof typeof settings.privacy] ? "bg-teal-600" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        settings.privacy[item.key as keyof typeof settings.privacy] ? "right-0.5" : "left-0.5"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Notifications */}
          <FadeIn delay={0.4}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { key: "notify_labs", label: "New lab results available" },
                  { key: "notify_provider_requests", label: "Provider access requests" },
                  { key: "notify_wearable_sync", label: "Wearable sync alerts" },
                  { key: "notify_weekly_summary", label: "Weekly health summary" },
                ].map((item) => (
                  <div key={item.key} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">{item.label}</label>
                    <select
                      value={settings.notifications[item.key as keyof typeof settings.notifications]}
                      onChange={(e) => updateNotification(item.key, e.target.value)}
                      className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg border-0 focus:ring-2 focus:ring-teal-500"
                    >
                      {notifyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.5}>
          <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
            </button>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Sign out
            </button>
            <button className="text-sm text-red-600 hover:text-red-700 px-6 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              Delete account
            </button>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
