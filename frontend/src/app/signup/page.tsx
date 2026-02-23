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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-teal-600 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="text-xl font-bold">MedBridge</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Take control of your<br />health data today.
          </h2>
          <p className="mt-4 text-teal-100 text-lg">
            Connect your existing portals, add wearable data, and share with any provider you choose.
          </p>
        </div>
        <p className="text-sm text-teal-200">Free for patients &middot; Always</p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">MedBridge</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Start unifying your health records in minutes</p>

          {error && (
            <div
              id="signup-error"
              role="alert"
              className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First name</label>
                <input
                  id="first"
                  type="text"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                  placeholder="Jane"
                  required
                  aria-label="First name"
                  aria-describedby={error ? "signup-error" : undefined}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="last" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last name</label>
                <input
                  id="last"
                  type="text"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                  placeholder="Doe"
                  required
                  aria-label="Last name"
                  aria-describedby={error ? "signup-error" : undefined}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                required
                aria-label="Email address"
                aria-describedby={error ? "signup-error" : undefined}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of birth</label>
              <input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => update("dob", e.target.value)}
                aria-label="Date of birth"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a...</label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                aria-label="Account role"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="patient">Patient</option>
                <option value="provider">Healthcare Provider</option>
                <option value="admin">Hospital Administrator</option>
              </select>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                required
                aria-label="Password"
                aria-describedby="password-requirements"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              {/* Password strength indicator */}
              {form.password.length > 0 && (
                <ul id="password-requirements" className="mt-2 space-y-1" aria-label="Password requirements">
                  {passwordChecks.map((check) => (
                    <li key={check.label} className="flex items-center gap-2 text-xs">
                      {check.met ? (
                        <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={check.met ? "text-green-600 dark:text-green-400" : "text-gray-400"}>
                        {check.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
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
                className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  confirmPassword.length > 0 && !passwordsMatch
                    ? "border-red-300 dark:border-red-700"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p id="password-mismatch" className="mt-1 text-xs text-red-500">
                  Passwords do not match
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !allChecksMet || (confirmPassword.length > 0 && !passwordsMatch)}
              className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
            Your data is encrypted and HIPAA-protected.
          </p>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
