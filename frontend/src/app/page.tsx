import type { ReactNode } from "react";
import Link from "next/link";
import {
  FadeIn,
  FadeInStagger,
  FadeInStaggerItem,
} from "@/components/AnimatedSection";

function LogoMark() {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-cyan-400 via-teal-300 to-violet-400 shadow-[0_0_28px_rgba(104,240,216,0.28)]">
      <div className="absolute inset-[1px] rounded-[1.25rem] bg-slate-950/90" />
      <svg className="relative z-10 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </div>
  );
}

function IconFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-200">
      {children}
    </div>
  );
}

const proofCards = [
  {
    value: "1 dashboard",
    label: "One patient view for labs, meds, scans, and outside records.",
  },
  {
    value: "FHIR + OCR",
    label: "Structured import when portals cooperate. Document intelligence when they do not.",
  },
  {
    value: "Patient-owned",
    label: "Share the clean record forward without waiting on a fax queue.",
  },
];

const capabilityCards = [
  {
    title: "Portal gravity breaker",
    description:
      "Connect modern patient portals and stop forcing people to remember where each result lives.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 00-6.364-6.364L4.5 8.25l4.5 4.5" />
      </svg>
    ),
  },
  {
    title: "Document rescue layer",
    description:
      "Upload referral packets, discharge paperwork, lab PDFs, screenshots, and scanned records without breaking the workflow.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12h6m-6 3h3.75m-8.25 3h13.5A2.25 2.25 0 0021 18.75V7.5a2.25 2.25 0 00-.659-1.591l-4.25-4.25A2.25 2.25 0 0014.5 1H5.25A2.25 2.25 0 003 3.25v15.5A2.25 2.25 0 005.25 21z" />
      </svg>
    ),
  },
  {
    title: "Trust by provenance",
    description:
      "Every data point keeps its source, facility, and import method attached so clinicians know what they are looking at.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Provider handoff packets",
    description:
      "Turn fragmented charts into a clean summary a new physician can review before the patient repeats their history from scratch.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5" />
      </svg>
    ),
  },
  {
    title: "Live continuity score",
    description:
      "Show where the patient record is strong, where it is stale, and which outside systems still hold missing context.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125l4.243-4.243a1.5 1.5 0 012.121 0l2.758 2.758a1.5 1.5 0 002.121 0l6.507-6.507M21 7.5v6h-6" />
      </svg>
    ),
  },
  {
    title: "Consent-first sharing",
    description:
      "Patients control which provider gets access, for how long, and with a full audit trail behind every export.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 8.25h.008v.008H18V8.25zm0 0A2.25 2.25 0 0020.25 6V4.5A2.25 2.25 0 0018 2.25h-1.5A2.25 2.25 0 0014.25 4.5V6A2.25 2.25 0 0016.5 8.25M18 8.25H6A2.25 2.25 0 003.75 10.5v9A2.25 2.25 0 006 21.75h12A2.25 2.25 0 0020.25 19.5v-9A2.25 2.25 0 0018 8.25z" />
      </svg>
    ),
  },
];

const workflow = [
  {
    step: "01",
    title: "Pull records from wherever they already live",
    description:
      "Connect compatible portals first, then backfill the stubborn systems with uploads, exports, and scanned paperwork.",
  },
  {
    step: "02",
    title: "Normalize them into one longitudinal story",
    description:
      "MedBridge organizes medications, labs, encounters, and documents into a record a human can actually reason about.",
  },
  {
    step: "03",
    title: "Move care forward with less friction",
    description:
      "Share a clean packet with the next provider instead of restarting the intake loop at every visit.",
  },
];

const trustLayers = [
  "HIPAA-first architecture",
  "Source-aware audit trail",
  "Encrypted originals retained",
  "Human review before messy data becomes canonical",
];

export default function Home() {
  return (
    <div className="app-shell ambient-grid min-h-screen overflow-x-hidden text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-200/70">MedBridge</div>
              <div className="text-xs text-slate-400">The continuity layer for modern care</div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="eyebrow-stat px-3 py-1 text-xs">FHIR-native</span>
            <span className="eyebrow-stat px-3 py-1 text-xs">Document OCR</span>
            <span className="eyebrow-stat px-3 py-1 text-xs">Provider handoffs</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-300 transition-colors hover:text-white">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
            >
              Start building your record
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-20">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10">
              <FadeIn>
                <span className="section-label">Fragmented healthcare is the bug</span>
              </FadeIn>

              <FadeIn delay={0.05}>
                <h1 className="hero-title mt-7 max-w-4xl text-5xl font-semibold leading-[0.96] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                  Your chart should follow your body, not your hospital.
                </h1>
              </FadeIn>

              <FadeIn delay={0.1}>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                  MedBridge turns disconnected portals, referral PDFs, discharge packets, and scanned records into one
                  living patient record patients and providers can actually use.
                </p>
              </FadeIn>

              <FadeIn delay={0.15}>
                <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/signup"
                    className="rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-400 px-7 py-3.5 text-center text-base font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
                  >
                    Build your unified record
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-white/12 bg-white/[0.04] px-7 py-3.5 text-center text-base font-medium text-white transition-colors hover:bg-white/[0.08]"
                  >
                    Enter the live demo
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="mt-9 flex flex-wrap gap-3">
                  <span className="data-pill">Epic, athenahealth, eClinicalWorks, Cerner, MEDITECH</span>
                  <span className="data-pill">Structured import + messy record rescue</span>
                  <span className="data-pill">Patient-controlled sharing</span>
                </div>
              </FadeIn>
            </div>

            <FadeIn delay={0.2} className="relative">
              <div className="glass-panel panel-border-glow scanline relative overflow-hidden rounded-[2rem] p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-cyan-200/60">Continuity engine</div>
                    <div className="mt-1 text-xl font-semibold text-white">Patient mission control</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.08] px-3 py-1 text-xs text-emerald-200">
                    Live sync
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="glass-panel-soft metric-orb rounded-[1.6rem] p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">Continuity score</div>
                    <div className="mt-4 flex items-end gap-3">
                      <div className="text-6xl font-semibold tracking-[-0.06em] text-white">94</div>
                      <div className="pb-3 text-sm text-slate-400">of 100</div>
                    </div>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">
                      Strong records across labs, medications, and consult notes. Two outside systems still need
                      backfill.
                    </p>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/6">
                      <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-400" />
                    </div>
                  </div>

                  <div className="glass-panel-soft rounded-[1.6rem] p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">Source fabric</div>
                    <div className="mt-4 space-y-3">
                      {[
                        { name: "Epic MyChart", status: "Connected", color: "bg-cyan-300" },
                        { name: "eClinicalWorks", status: "Document import", color: "bg-violet-300" },
                        { name: "LabCorp PDF", status: "Structured", color: "bg-emerald-300" },
                      ].map((source) => (
                        <div key={source.name} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`h-2.5 w-2.5 rounded-full ${source.color}`} />
                            <span className="text-sm text-white">{source.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">{source.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="glass-panel-soft rounded-[1.6rem] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-white">Latest care context</div>
                      <div className="text-xs text-slate-400">Ready for handoff</div>
                    </div>
                    <div className="mt-4 space-y-4">
                      {[
                        ["Medication change", "Metformin adjusted after elevated A1c result"],
                        ["Outside specialist note", "Cardiology consult merged from scanned PDF"],
                        ["Share packet", "Referral packet ready for next PCP appointment"],
                      ].map(([title, text]) => (
                        <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <div className="text-sm font-medium text-white">{title}</div>
                          <div className="mt-1 text-sm text-slate-400">{text}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel-soft rounded-[1.6rem] p-5">
                    <div className="text-sm font-medium text-white">Workflow before MedBridge</div>
                    <div className="mt-4 space-y-3">
                      {[
                        "Outside labs buried in a portal nobody checks",
                        "Referral packet arrives late and incomplete",
                        "Patient repeats history from memory again",
                      ].map((line) => (
                        <div key={line} className="rounded-2xl border border-rose-300/10 bg-rose-500/[0.06] px-4 py-3 text-sm text-rose-100">
                          {line}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-2xl border border-emerald-300/10 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-100">
                      After MedBridge: the next clinician opens one source-aware record instead of chasing five systems.
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-7xl">
            <FadeInStagger className="grid gap-4 md:grid-cols-3">
              {proofCards.map((card) => (
                <FadeInStaggerItem key={card.value}>
                  <div className="glass-panel-soft rounded-[1.75rem] p-6">
                    <div className="text-2xl font-semibold tracking-[-0.04em] text-white">{card.value}</div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{card.label}</p>
                  </div>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <FadeIn className="max-w-3xl">
              <span className="section-label">Product surface</span>
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Built for the ugly reality of fragmented care, not the fantasy of perfect interoperability.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                MedBridge works when APIs exist, when only exports exist, and when all you have is a scanned packet
                from a system that still thinks faxing is a modern workflow.
              </p>
            </FadeIn>

            <FadeInStagger className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {capabilityCards.map((card) => (
                <FadeInStaggerItem key={card.title}>
                  <div className="glass-panel-soft h-full rounded-[1.8rem] p-6 transition-transform duration-300 hover:-translate-y-1">
                    <IconFrame>{card.icon}</IconFrame>
                    <h3 className="mt-5 text-xl font-semibold text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{card.description}</p>
                  </div>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <FadeIn className="glass-panel rounded-[2rem] p-7 sm:p-8">
              <span className="section-label">Execution model</span>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                The beta path is clear: ingest anything, normalize everything, share cleanly.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-300">
                This is not an EHR replacement pitch. It is a workflow repair layer for patients and clinicians stuck
                between incompatible systems.
              </p>
              <div className="mt-8 space-y-3">
                {trustLayers.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
                    <span className="text-sm text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeInStagger className="grid gap-4">
              {workflow.map((item) => (
                <FadeInStaggerItem key={item.step}>
                  <div className="glass-panel-soft rounded-[1.8rem] p-6 sm:p-7">
                    <div className="flex items-start gap-5">
                      <div className="rounded-2xl bg-gradient-to-br from-cyan-300 via-teal-300 to-violet-400 px-4 py-3 text-lg font-semibold text-slate-950">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          </div>
        </section>

        <section className="px-4 pb-20 pt-8 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-7xl">
            <FadeIn className="glass-panel panel-border-glow rounded-[2.25rem] px-6 py-10 text-center sm:px-12 sm:py-14">
              <span className="section-label">The hook is simple</span>
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                Stop making patients act like human middleware.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                MedBridge gives care teams a cleaner patient story and gives patients one place to carry it forward.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-violet-400 px-7 py-3.5 text-base font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  Launch MedBridge
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/12 bg-white/[0.04] px-7 py-3.5 text-base font-medium text-white transition-colors hover:bg-white/[0.08]"
                >
                  Explore the demo
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>
    </div>
  );
}
