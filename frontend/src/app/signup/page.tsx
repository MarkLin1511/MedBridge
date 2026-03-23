"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "patient",
    password: "",
    dob: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const passwordChecks = [
    { label: "At least 8 characters", met: form.password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(form.password) },
    { label: "Lowercase letter", met: /[a-z]/.test(form.password) },
    { label: "Number", met: /\d/.test(form.password) },
  ];

  const allChecksMet = passwordChecks.every((c) => c.met);
  const passwordsMatch = form.password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allChecksMet) {
      const msg = "Password does not meet all requirements";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!passwordsMatch) {
      const msg = "Passwords do not match";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await signup({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        role: form.role,
        dob: form.dob || undefined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      let displayMsg: string;
      if (message.includes("already registered")) {
        displayMsg = "An account with this email already exists";
      } else {
        displayMsg = "Signup failed. Please try again.";
      }
      setError(displayMsg);
      toast.error(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="medbridge-themed min-h-screen">
      <div className="medbridge-page-content mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.02fr_minmax(0,0.98fr)]">
          <div className="hidden lg:flex medbridge-panel rounded-[2rem] p-10 flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-500 shadow-lg shadow-teal-950/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div>
                  <div className="medbridge-kicker text-[11px] font-semibold">Patient-controlled access</div>
                  <div className="text-lg font-semibold text-white">MedBridge</div>
                </div>
              </Link>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-teal-100">
                New account
              </span>
            </div>

            <div className="max-w-xl">
              <p className="medbridge-kicker text-xs font-semibold">Start the demo journey</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
                Bring every portal, provider, and wearable feed into one calm timeline.
              </h2>
              <p className="mt-5 text-lg leading-8 medbridge-copy">
                The signup flow now shares the same dark-glass shell and clinical accent palette as the landing page and dashboard, so the experience feels cohesive before the first record ever loads.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Portal sync", value: "Epic + Cerner" },
                  { label: "Sharing controls", value: "Granular" },
                  { label: "Audit history", value: "Always on" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
                    <div className="mt-2 text-sm font-semibold leading-6 text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 shadow-[0_24px_60px_rgba(2,8,20,0.35)]">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-sm font-semibold text-white">What you get on day one</span>
                  <span className="text-xs text-slate-400">Built for patients</span>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    "Connect existing records with SMART on FHIR flows.",
                    "Review a unified timeline across visits, labs, and wearables.",
                    "Approve or revoke provider access from one dashboard.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-300 shrink-0" />
                      <p className="text-sm leading-6 text-slate-200">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl lg:justify-self-end">
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
                    <div className="text-xs text-slate-400">Create secure access</div>
                  </div>
                </Link>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Onboarding
                </span>
              </div>

              <div className="mt-10">
                <h1 className="text-3xl font-semibold text-white">Create your account</h1>
                <p className="mt-3 text-sm leading-6 medbridge-copy">Start unifying your health records in minutes</p>
              </div>

              {error && (
                <div
                  id="signup-error"
                  role="alert"
                  className="mt-5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first" className="mb-1.5 block text-sm font-medium text-slate-200">First name</label>
                    <input
                      id="first"
                      type="text"
                      value={form.first_name}
                      onChange={(e) => update("first_name", e.target.value)}
                      placeholder="Jane"
                      required
                      aria-label="First name"
                      aria-describedby={error ? "signup-error" : undefined}
                      className="medbridge-input w-full rounded-xl px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="last" className="mb-1.5 block text-sm font-medium text-slate-200">Last name</label>
                    <input
                      id="last"
                      type="text"
                      value={form.last_name}
                      onChange={(e) => update("last_name", e.target.value)}
                      placeholder="Doe"
                      required
                      aria-label="Last name"
                      aria-describedby={error ? "signup-error" : undefined}
                      className="medbridge-input w-full rounded-xl px-4 py-3 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com"
                    required
                    aria-label="Email address"
                    aria-describedby={error ? "signup-error" : undefined}
                    className="medbridge-input w-full rounded-xl px-4 py-3 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="dob" className="mb-1.5 block text-sm font-medium text-slate-200">Date of birth</label>
                    <input
                      id="dob"
                      type="date"
                      value={form.dob}
                      onChange={(e) => update("dob", e.target.value)}
                      aria-label="Date of birth"
                      className="medbridge-input w-full rounded-xl px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-200">I am a...</label>
                    <select
                      id="role"
                      value={form.role}
                      onChange={(e) => update("role", e.target.value)}
                      aria-label="Account role"
                      className="medbridge-input w-full rounded-xl px-4 py-3 text-sm"
                    >
                      <option value="patient">Patient</option>
                      <option value="provider">Healthcare Provider</option>
                      <option value="admin">Hospital Administrator</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-200">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="••••••••"
                    required
                    aria-label="Password"
                    aria-describedby="password-requirements"
                    className="medbridge-input w-full rounded-xl px-4 py-3 text-sm"
                  />
                  {form.password.length > 0 && (
                    <ul id="password-requirements" className="mt-3 space-y-2" aria-label="Password requirements">
                      {passwordChecks.map((check) => (
                        <li key={check.label} className="flex items-center gap-2 text-xs">
                          {check.met ? (
                            <svg className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className={check.met ? "text-emerald-200" : "text-slate-400"}>
                            {check.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-200">Confirm password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    aria-label="Confirm password"
                    aria-describedby={
                      confirmPassword.length > 0 && !passwordsMatch ? "password-mismatch" : error ? "signup-error" : undefined
                    }
                    className={`medbridge-input w-full rounded-xl px-4 py-3 text-sm ${
                      confirmPassword.length > 0 && !passwordsMatch ? "border-red-400/30" : ""
                    }`}
                  />
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p id="password-mismatch" className="mt-2 text-xs text-red-200">
                      Passwords do not match
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !allChecksMet || (confirmPassword.length > 0 && !passwordsMatch)}
                  className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 font-medium text-white shadow-lg shadow-teal-950/40 transition-transform duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs leading-6 text-slate-400">
                By signing up, you agree to our Terms of Service and Privacy Policy.
                Your data is encrypted and HIPAA-protected.
              </p>

              <div className="mt-6 text-center text-sm text-slate-300">
                Already have an account?{" "}
                <Link href="/login" className="medbridge-link font-medium">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
