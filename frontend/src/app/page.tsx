import Link from "next/link";
import {
  FadeIn,
  FadeInStagger,
  FadeInStaggerItem,
} from "@/components/AnimatedSection";

/* ──────────────────────────── Icon helpers ──────────────────────────── */

function IconUnifiedRecords() {
  return (
    <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5M3.75 14.25h16.5M8.25 4.5v15M15.75 4.5v15M4.5 19.5h15a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-15a.75.75 0 00-.75.75v13.5c0 .414.336.75.75.75z" />
    </svg>
  );
}

function IconFHIR() {
  return (
    <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.25l4.5 4.5" />
    </svg>
  );
}

function IconWearable() {
  return (
    <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function IconProviderControl() {
  return (
    <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconHIPAA() {
  return (
    <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function IconExport() {
  return (
    <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

/* ──────────────────────────── Data ──────────────────────────── */

const features = [
  {
    icon: <IconUnifiedRecords />,
    title: "Unified Records",
    desc: "All labs, medications, imaging, and visit notes from every provider consolidated in one chronological view.",
  },
  {
    icon: <IconFHIR />,
    title: "FHIR R4 Integration",
    desc: "Connect to Epic, Cerner, VA Health, and more via SMART on FHIR -- the healthcare interoperability standard.",
  },
  {
    icon: <IconWearable />,
    title: "Wearable Sync",
    desc: "Apple Watch, Fitbit, and other wearable data streams alongside your clinical records in real-time.",
  },
  {
    icon: <IconProviderControl />,
    title: "Provider Control",
    desc: "Grant or revoke provider access to your records with a single click. You decide who sees what.",
  },
  {
    icon: <IconHIPAA />,
    title: "HIPAA Compliant",
    desc: "End-to-end encryption, comprehensive audit logging, and secure-by-design architecture from day one.",
  },
  {
    icon: <IconExport />,
    title: "Export Anywhere",
    desc: "Download your complete health records in FHIR R4 format anytime. Your data is never locked in.",
  },
];

const steps = [
  {
    num: "01",
    title: "Connect Your Portals",
    desc: "Link Epic, Cerner, VA Health, and other patient portals in minutes with secure OAuth-based SMART on FHIR connections.",
  },
  {
    num: "02",
    title: "View Your Dashboard",
    desc: "See all of your health data -- labs, medications, vitals, wearable metrics -- unified in a single, intuitive dashboard.",
  },
  {
    num: "03",
    title: "Stay In Control",
    desc: "Manage exactly who can access your records. Approve or deny provider requests, export data, and review audit logs.",
  },
];

const trustBadges = [
  { label: "FHIR R4 Compliant", icon: "link" },
  { label: "AES-256 Encryption", icon: "lock" },
  { label: "Audit Logged", icon: "clipboard" },
  { label: "SOC 2 Ready", icon: "shield" },
];

/* ──────────────────────────── Page ──────────────────────────── */

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── Navigation ── */}
      <nav className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">MedBridge</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700">
        {/* Subtle radial highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.12),transparent)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-24 sm:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div>
              <FadeIn>
                <div className="inline-flex items-center gap-2 text-sm text-teal-100 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full mb-6 border border-white/10">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full" />
                  Open-source health records platform
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                  Your Health Records, Unified
                </h1>
              </FadeIn>

              <FadeIn delay={0.2}>
                <p className="mt-6 text-lg sm:text-xl text-teal-100 leading-relaxed max-w-xl">
                  MedBridge connects all your medical portals, wearables, and
                  providers into one secure, patient-controlled dashboard.
                </p>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center bg-white text-teal-700 px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-teal-50 transition-colors shadow-lg shadow-teal-900/20"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center border-2 border-white/30 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-white/10 transition-colors"
                  >
                    Try Demo
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Right: dashboard mockup */}
            <FadeIn delay={0.35} className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1 shadow-2xl shadow-black/20">
                <div className="bg-gray-900/80 rounded-xl overflow-hidden">
                  {/* Mock top bar */}
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs text-gray-400">Dashboard</span>
                    <div className="flex gap-2">
                      <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">Epic</span>
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full">VA Health</span>
                    </div>
                  </div>

                  {/* Mock vitals */}
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "Heart Rate", value: "72", unit: "bpm" },
                      { label: "Blood Pressure", value: "128/82", unit: "" },
                      { label: "Glucose", value: "112", unit: "mg/dL" },
                    ].map((v) => (
                      <div key={v.label} className="bg-white/5 rounded-lg p-3">
                        <div className="text-[10px] text-gray-400">{v.label}</div>
                        <div className="mt-1 text-lg font-semibold text-white">
                          {v.value}{" "}
                          {v.unit && <span className="text-xs font-normal text-gray-500">{v.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mock chart */}
                  <div className="px-4 pb-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium text-gray-400">Lab Trends - Glucose</span>
                        <span className="text-[10px] text-gray-500">6 months</span>
                      </div>
                      <div className="flex items-end gap-1.5 h-16">
                        {[38, 42, 50, 58, 65, 72].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end">
                            <div
                              className={`rounded-sm ${i >= 4 ? "bg-amber-400/80" : "bg-teal-400/80"}`}
                              style={{ height: `${h}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Wave bottom divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 56h1440V28C1320 6 1200 0 1080 8c-120 8-240 30-360 34S480 38 360 26C240 14 120 6 0 14v42z" className="fill-white dark:fill-gray-950" />
          </svg>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Everything you need in one place
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              MedBridge brings together the tools, integrations, and security
              features that modern healthcare demands.
            </p>
          </FadeIn>

          <FadeInStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <FadeInStaggerItem key={f.title}>
                <div className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg hover:shadow-teal-50 dark:hover:shadow-teal-950/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center mb-4 group-hover:bg-teal-100 dark:group-hover:bg-teal-900 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Get started in three simple steps. No faxes, no phone calls, no
              duplicate paperwork.
            </p>
          </FadeIn>

          <FadeInStagger className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {steps.map((s) => (
              <FadeInStaggerItem key={s.num}>
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-600 text-white text-xl font-bold mb-5">
                    {s.num}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* ── Trust / Security ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Built for Security
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              MedBridge follows a HIPAA-first architecture. All data is encrypted
              at rest and in transit. Every access event is audit-logged, and our
              infrastructure is designed to meet SOC 2 Type II requirements.
            </p>
          </FadeIn>

          <FadeInStagger className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-3xl mx-auto">
            {trustBadges.map((b) => (
              <FadeInStaggerItem key={b.label}>
                <div className="flex flex-col items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center mb-3">
                    {b.icon === "link" && (
                      <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.25l4.5 4.5" />
                      </svg>
                    )}
                    {b.icon === "lock" && (
                      <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    )}
                    {b.icon === "clipboard" && (
                      <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                      </svg>
                    )}
                    {b.icon === "shield" && (
                      <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{b.label}</span>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight max-w-2xl mx-auto">
              Ready to take control of your health data?
            </h2>
            <p className="mt-4 text-lg text-teal-100 max-w-xl mx-auto">
              Join patients who are unifying their records, connecting their
              providers, and owning their health information.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-white text-teal-700 px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-teal-50 transition-colors shadow-lg shadow-teal-900/20"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center border-2 border-white/30 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-white/10 transition-colors"
              >
                Try Demo
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & copyright */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">MedBridge</span>
              <span className="text-sm text-gray-400 ml-2">&copy; {new Date().getFullYear()}</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                Contact
              </a>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>HIPAA Compliant</span>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              <span>FHIR R4</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
