"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
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
            <Link href="/login" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 text-sm text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-teal-600 rounded-full" />
              Open-source health records platform
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight leading-[1.1]"
          >
            Stop repeating your
            <br />
            medical history.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl"
          >
            MedBridge connects Epic, Cerner, VA Health, and your wearables into one
            record that you actually own. Any doctor you authorize sees your complete
            history — no faxes, no phone calls.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Link href="/signup" className="inline-flex items-center justify-center bg-teal-600 text-white px-8 py-3.5 rounded-lg text-base font-medium hover:bg-teal-700 transition-colors">
              Get started — it&apos;s free
            </Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3.5 rounded-lg text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              View demo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
              {/* Mock dashboard top bar */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Dashboard</span>
                  <span className="text-xs text-gray-400">Marcus Johnson</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    Epic MyChart
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    VA Health
                  </span>
                </div>
              </div>
              {/* Mock vitals row */}
              <div className="p-5 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <div className="text-xs text-gray-500">Heart Rate</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">72 <span className="text-sm font-normal text-gray-400">bpm</span></div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <div className="text-xs text-gray-500">Blood Pressure</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">128/82</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <div className="text-xs text-gray-500">Glucose</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    112 <span className="text-sm font-normal text-gray-400">mg/dL</span>
                    <span className="ml-1 text-amber-600 text-sm">↑</span>
                  </div>
                </div>
              </div>
              {/* Mock chart area */}
              <div className="px-5 pb-5">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Lab Trends — Glucose (fasting)</span>
                    <span className="text-xs text-gray-400">Last 6 months</span>
                  </div>
                  <div className="flex items-end gap-2 h-20">
                    {[40, 42, 55, 60, 65, 75].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end">
                        <div
                          className={`rounded-t ${i >= 4 ? "bg-amber-400" : "bg-teal-400 dark:bg-teal-500"}`}
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {["Jun", "Aug", "Oct", "Nov", "Dec", "Jan"].map((m) => (
                      <span key={m} className="text-[10px] text-gray-400 flex-1 text-center">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Health records shouldn&apos;t require a phone call
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              You get bloodwork at one office using Epic. You see a specialist who uses
              Cerner. Your results don&apos;t transfer. The new doctor orders duplicate
              tests. You pay twice.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6"
            >
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Today</div>
              <div className="space-y-3">
                {[
                  "Epic MyChart — primary care records",
                  "VA Health — specialist records",
                  "Apple Health — wearable data",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-400">Siloed. No crosstalk. Duplicate tests.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-800 rounded-2xl p-6"
            >
              <div className="text-sm font-medium text-teal-600 uppercase tracking-wider mb-4">With MedBridge</div>
              <div className="space-y-3">
                {[
                  "All portals in one unified timeline",
                  "Wearable data alongside lab results",
                  "You control who sees what",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-teal-600 dark:text-teal-400">One record. Patient-owned. Standards-based.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight text-center mb-16"
          >
            What matters
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            {[
              {
                num: "01",
                title: "One unified record",
                desc: "Every lab result, medication, visit, and imaging report from every portal — in a single, chronological timeline.",
              },
              {
                num: "02",
                title: "Patient-owned access",
                desc: "You decide which providers see your records. Grant access in one click, revoke it just as fast.",
              },
              {
                num: "03",
                title: "Healthcare standards",
                desc: "Built on FHIR R4 and LOINC codes. Your data is portable, interoperable, and never locked in.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-3">{item.num}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight max-w-xl mx-auto">
              Your health data shouldn&apos;t be scattered across five different apps.
            </h2>
            <div className="mt-8">
              <Link href="/signup" className="inline-flex items-center justify-center bg-teal-600 text-white px-8 py-3.5 rounded-lg text-base font-medium hover:bg-teal-700 transition-colors">
                Get started for free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-5 h-5 rounded bg-teal-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            MedBridge &copy; 2026
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <span>HIPAA Compliant</span>
            <span>FHIR R4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
