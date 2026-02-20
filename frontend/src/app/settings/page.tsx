"use client";

import Navbar from "@/components/Navbar";
import { FadeIn } from "@/components/AnimatedSection";

const sections = [
  {
    title: "Profile",
    items: [
      { label: "Full name", value: "Marcus Johnson", type: "text" },
      { label: "Email", value: "marcus.johnson@email.com", type: "email" },
      { label: "Date of birth", value: "1988-03-14", type: "date" },
      { label: "Patient ID", value: "MBR-20240001", type: "readonly" },
    ],
  },
  {
    title: "Security",
    items: [
      { label: "Password", value: "••••••••••", type: "password" },
      { label: "Two-factor authentication", value: "Enabled", type: "toggle" },
      { label: "Session timeout", value: "30 minutes", type: "select" },
    ],
  },
  {
    title: "Privacy & Data Sharing",
    items: [
      { label: "Share lab results with providers", value: "Enabled", type: "toggle" },
      { label: "Share wearable data", value: "Enabled", type: "toggle" },
      { label: "Allow data export (FHIR)", value: "Enabled", type: "toggle" },
      { label: "Require approval for new provider access", value: "Enabled", type: "toggle" },
    ],
  },
  {
    title: "Notifications",
    items: [
      { label: "New lab results available", value: "Email + Push", type: "select" },
      { label: "Provider access requests", value: "Email + Push", type: "select" },
      { label: "Wearable sync alerts", value: "Push only", type: "select" },
      { label: "Weekly health summary", value: "Email", type: "select" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <FadeIn>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your account, security, and data preferences</p>
        </FadeIn>

        <div className="mt-8 space-y-8">
          {sections.map((section, si) => (
            <FadeIn key={section.title} delay={si * 0.1}>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white">{section.title}</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {section.items.map((item) => (
                    <div key={item.label} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">{item.label}</label>
                      {item.type === "toggle" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{item.value}</span>
                          <div className="w-9 h-5 rounded-full bg-teal-600 relative cursor-pointer">
                            <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
                          </div>
                        </div>
                      ) : item.type === "readonly" ? (
                        <span className="text-sm text-gray-500 font-mono">{item.value}</span>
                      ) : item.type === "password" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{item.value}</span>
                          <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">Change</button>
                        </div>
                      ) : item.type === "select" ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">{item.value}</span>
                      ) : (
                        <input
                          type={item.type}
                          defaultValue={item.value}
                          className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.4}>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button className="bg-teal-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
              Save changes
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
