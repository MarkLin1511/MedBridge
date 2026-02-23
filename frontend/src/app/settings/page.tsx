"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { FadeIn } from "@/components/AnimatedSection";
import { useAuth } from "@/lib/auth";
import { api, SettingsData } from "@/lib/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Baseline settings snapshot for unsaved-changes detection
  const baselineRef = useRef<SettingsData | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Change Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete Account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Password strength checks
  const pwChecks = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasDigit: /\d/.test(newPassword),
  };
  const passwordStrong = pwChecks.minLength && pwChecks.hasUpper && pwChecks.hasLower && pwChecks.hasDigit;

  // Dirty detection helper
  const checkDirty = useCallback(
    (updated: SettingsData) => {
      if (!baselineRef.current) return;
      const base = baselineRef.current;
      const dirty =
        updated.profile.first_name !== base.profile.first_name ||
        updated.profile.last_name !== base.profile.last_name ||
        updated.profile.email !== base.profile.email ||
        updated.profile.dob !== base.profile.dob ||
        updated.security.two_factor_enabled !== base.security.two_factor_enabled ||
        updated.security.session_timeout !== base.security.session_timeout ||
        updated.privacy.share_labs !== base.privacy.share_labs ||
        updated.privacy.share_wearable !== base.privacy.share_wearable ||
        updated.privacy.allow_export !== base.privacy.allow_export ||
        updated.privacy.require_approval !== base.privacy.require_approval ||
        updated.notifications.notify_labs !== base.notifications.notify_labs ||
        updated.notifications.notify_provider_requests !== base.notifications.notify_provider_requests ||
        updated.notifications.notify_wearable_sync !== base.notifications.notify_wearable_sync ||
        updated.notifications.notify_weekly_summary !== base.notifications.notify_weekly_summary;
      setIsDirty(dirty);
    },
    [],
  );

  // Warn on navigation when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    api
      .getSettings()
      .then((data) => {
        setSettings(data);
        baselineRef.current = JSON.parse(JSON.stringify(data));
      })
      .catch(() => toast.error("Failed to load settings"))
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
      toast.success("Settings saved successfully");
      setSaved(true);
      // Update baseline after successful save
      baselineRef.current = JSON.parse(JSON.stringify(settings));
      setIsDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordStrong) {
      toast.error("Password does not meet strength requirements");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (!oldPassword) {
      toast.error("Please enter your current password");
      return;
    }
    setChangingPassword(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      toast.success("Password changed");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const updateProfile = (field: string, value: string) => {
    if (!settings) return;
    const updated = { ...settings, profile: { ...settings.profile, [field]: value } };
    setSettings(updated);
    checkDirty(updated);
  };

  const togglePrivacy = (field: string) => {
    if (!settings) return;
    const updated = {
      ...settings,
      privacy: { ...settings.privacy, [field]: !settings.privacy[field as keyof typeof settings.privacy] },
    };
    setSettings(updated);
    checkDirty(updated);
  };

  const toggleSecurity = (field: string, value: boolean | number) => {
    if (!settings) return;
    const updated = { ...settings, security: { ...settings.security, [field]: value } };
    setSettings(updated);
    checkDirty(updated);
  };

  const updateNotification = (field: string, value: string) => {
    if (!settings) return;
    const updated = { ...settings, notifications: { ...settings.notifications, [field]: value } };
    setSettings(updated);
    checkDirty(updated);
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

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account</h3>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete your account? This action cannot be undone. All your medical records will be permanently removed.
            </p>
            <div className="mt-4">
              <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type &quot;DELETE&quot; to confirm:
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                aria-label="Type DELETE to confirm account deletion"
                className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="text-sm text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== "DELETE"}
                onClick={() => {
                  toast.error("Account deletion is not yet available. Contact support.");
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="text-sm font-medium text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <input
                      type="text"
                      value={settings.profile.first_name}
                      onChange={(e) => updateProfile("first_name", e.target.value)}
                      aria-label="First name"
                      className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={settings.profile.last_name}
                      onChange={(e) => updateProfile("last_name", e.target.value)}
                      aria-label="Last name"
                      className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => updateProfile("email", e.target.value)}
                    aria-label="Email address"
                    className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Date of birth</label>
                  <input
                    type="date"
                    value={settings.profile.dob || ""}
                    onChange={(e) => updateProfile("dob", e.target.value)}
                    aria-label="Date of birth"
                    className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
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
                    role="switch"
                    aria-checked={settings.security.two_factor_enabled}
                    aria-label="Toggle two-factor authentication"
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
                    aria-label="Session timeout duration"
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

          {/* Change Password */}
          <FadeIn delay={0.25}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label htmlFor="current-password" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                  <input
                    id="current-password"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    aria-label="Current password"
                    autoComplete="current-password"
                    className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    aria-label="New password"
                    autoComplete="new-password"
                    className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-label="Confirm new password"
                    autoComplete="new-password"
                    className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                {/* Password strength checklist */}
                {newPassword.length > 0 && (
                  <ul className="space-y-1 text-xs" aria-label="Password requirements">
                    {[
                      { met: pwChecks.minLength, label: "At least 8 characters" },
                      { met: pwChecks.hasUpper, label: "One uppercase letter" },
                      { met: pwChecks.hasLower, label: "One lowercase letter" },
                      { met: pwChecks.hasDigit, label: "One digit" },
                    ].map((rule) => (
                      <li key={rule.label} className={`flex items-center gap-1.5 ${rule.met ? "text-teal-600" : "text-gray-400 dark:text-gray-500"}`}>
                        {rule.met ? (
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="9" />
                          </svg>
                        )}
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
                  className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
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
                      role="switch"
                      aria-checked={!!settings.privacy[item.key as keyof typeof settings.privacy]}
                      aria-label={`Toggle ${item.label.toLowerCase()}`}
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
                      aria-label={`Notification preference for ${item.label.toLowerCase()}`}
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
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
              </button>
              {isDirty && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
                  </svg>
                  Unsaved changes
                </span>
              )}
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Sign out
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-sm text-red-600 hover:text-red-700 px-6 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Delete account
            </button>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
