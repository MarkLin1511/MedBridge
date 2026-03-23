"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      const msg = "Invalid email or password";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await demoLogin();
    } catch {
      const msg = "Demo account is temporarily unavailable. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medbridge-themed min-h-screen">
      <div className="medbridge-page-content mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.08fr_minmax(0,0.92fr)]">
          <div className="hidden lg:flex medbridge-panel rounded-[2rem] p-10 flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-500 shadow-lg shadow-teal-950/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div>
                  <div className="medbridge-kicker text-[11px] font-semibold">Unified Patient Record</div>
                  <div className="text-lg font-semibold text-white">MedBridge</div>
                </div>
              </Link>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-teal-100">
                Demo Access
              </span>
            </div>

            <div className="max-w-xl">
              <p className="medbridge-kicker text-xs font-semibold">Continuous care</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
                Your complete health record, always in one place.
              </h2>
              <p className="mt-5 text-lg leading-8 medbridge-copy">
                MedBridge now carries the same ambient, clinical theme from the landing experience into the demo login, so the transition into the live product feels seamless.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Connected portals", value: "12" },
                  { label: "FHIR exports", value: "3" },
                  { label: "Wearable feeds", value: "Live" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_24px_60px_rgba(2,8,20,0.35)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-400">Live dashboard preview</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Heart rate", value: "72 bpm" },
                    { label: "Glucose", value: "112 mg/dL" },
                    { label: "Portal sync", value: "4 min ago" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                      <div className="mt-2 text-sm font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 text-teal-200">
                    <span className="h-2 w-2 rounded-full bg-teal-300" />
                    HIPAA compliant
                  </span>
                  <span>FHIR R4</span>
                  <span>End-to-end encrypted</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md lg:justify-self-end">
            <div className="medbridge-auth-card rounded-[2rem] p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-500 shadow-lg shadow-teal-950/50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">MedBridge</div>
                    <div className="text-xs text-slate-400">Secure patient access</div>
                  </div>
                </Link>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Demo login
                </span>
              </div>

              <div className="mt-10">
                <h1 className="text-3xl font-semibold text-white">Welcome back</h1>
                <p className="mt-3 text-sm leading-6 medbridge-copy">Sign in to access your health records</p>
              </div>

              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    aria-label="Email address"
                    aria-describedby={error ? "login-error" : undefined}
                    className="medbridge-input w-full rounded-xl px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200">Password</label>
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed text-xs font-medium text-teal-200/70"
                      aria-label="Forgot password (coming soon)"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    aria-label="Password"
                    aria-describedby={error ? "login-error" : undefined}
                    className="medbridge-input w-full rounded-xl px-4 py-3 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 font-medium text-white shadow-lg shadow-teal-950/40 transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-4">
                <button
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full rounded-xl border border-dashed border-teal-300/30 bg-teal-400/8 px-4 py-3 font-medium text-teal-100 transition-colors hover:bg-teal-400/12 disabled:opacity-50"
                >
                  Try demo account <span className="text-xs opacity-70">(Demo mode)</span>
                </button>
                <p className="mt-2 text-center text-xs text-slate-400">
                  Instant access to the seeded MedBridge patient profile
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
                <span>HIPAA compliant</span>
                <span>FHIR R4</span>
                <span>AES-256</span>
              </div>

              <div className="mt-6 text-center text-sm text-slate-300">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="medbridge-link font-medium">Sign up</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
