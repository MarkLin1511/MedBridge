"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fade = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              MedBridge
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-24">
        <motion.div
          className="max-w-3xl"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fade} custom={0}>
            <span className="inline-flex items-center rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 px-3.5 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
              Open-source health records platform
            </span>
          </motion.div>

          <motion.h1
            variants={fade}
            custom={1}
            className="mt-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl"
          >
            Stop repeating your
            <br />
            medical history.
          </motion.h1>

          <motion.p
            variants={fade}
            custom={2}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400"
          >
            MedBridge connects Epic, Cerner, VA Health, and your wearables into
            one record that you actually own. Any doctor you authorize sees your
            complete history&nbsp;&mdash; no faxes, no phone calls.
          </motion.p>

          <motion.div
            variants={fade}
            custom={3}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link
              href="/register"
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Get started &mdash; it&apos;s free
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-gray-300 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              View demo
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Dashboard Preview ───────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-900 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Dashboard
              </span>
              <div className="flex gap-2">
                <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-900/40 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-200 dark:ring-purple-700">
                  Epic MyChart
                </span>
                <span className="inline-flex items-center rounded-md bg-sky-50 dark:bg-sky-900/40 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300 ring-1 ring-inset ring-sky-200 dark:ring-sky-700">
                  VA Health
                </span>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 p-6">
              <div className="rounded-xl border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Heart Rate
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  72{" "}
                  <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                    bpm
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Blood Pressure
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  128/82
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Glucose
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  112{" "}
                  <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                    mg/dL
                  </span>{" "}
                  <span className="text-sm text-amber-500">&#8593;</span>
                </p>
              </div>
            </div>

            {/* Chart mockup */}
            <div className="px-6 pb-6">
              <div className="rounded-xl border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    Heart Rate &mdash; 30 day trend
                  </span>
                  <div className="flex gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  </div>
                </div>
                {/* Faux chart bars */}
                <div className="flex items-end gap-1.5 h-24">
                  {[
                    40, 52, 48, 58, 44, 62, 55, 68, 60, 56, 64, 70, 58, 66,
                    72, 60, 68, 74, 65, 72, 68, 60, 76, 70,
                  ].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-teal-200 dark:bg-teal-700"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Problem / Solution ──────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Health records shouldn&apos;t require a phone call
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Every time you visit a new doctor, you fill out the same forms,
              re-explain your medications, and hope nothing gets lost. Your data
              exists&nbsp;&mdash; it&apos;s just stuck in portals that
              don&apos;t talk to each other.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {/* Today */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8"
            >
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                Today
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  "Epic MyChart — primary care only",
                  "VA Health — veterans records",
                  "Cerner — specialist visits",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-none text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-gray-400 dark:text-gray-500">
                Three logins. Three partial views. No single source of truth.
              </p>
            </motion.div>

            {/* With MedBridge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30 p-8"
            >
              <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                With MedBridge
              </p>
              <ul className="mt-6 space-y-4">
                {[
                  "All portals connected in one place",
                  "Complete medication and lab history",
                  "Share with any provider instantly",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-none text-teal-600 dark:text-teal-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                One login. One record. You control who sees it.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Three Pillars ───────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-900 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
          >
            What matters
          </motion.h2>

          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "One unified record",
                desc: "Every lab, medication, and visit from every portal — in a single timeline.",
              },
              {
                num: "02",
                title: "Patient-owned access",
                desc: "You decide who sees what, and revoke access anytime.",
              },
              {
                num: "03",
                title: "Healthcare standards",
                desc: "FHIR R4 and LOINC codes mean your data is portable and future-proof.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                  {item.num}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Your health data shouldn&apos;t be scattered across five different
              apps.
            </h2>
            <div className="mt-10">
              <Link
                href="/register"
                className="inline-flex rounded-lg bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
              >
                Get started for free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600">
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              MedBridge &copy; 2026
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            HIPAA Compliant &middot; FHIR R4
          </span>
        </div>
      </footer>
    </div>
  );
}
