import Link from "next/link";

export default function SignupPage() {
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

          <form className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First name</label>
                <input id="first" type="text" placeholder="Jane" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="last" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last name</label>
                <input id="last" type="text" placeholder="Doe" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input id="email" type="email" placeholder="you@example.com" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a...</label>
              <select id="role" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                <option value="patient">Patient</option>
                <option value="provider">Healthcare Provider</option>
                <option value="admin">Hospital Administrator</option>
              </select>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input id="password" type="password" placeholder="••••••••" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <button type="submit" className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors">
              Create account
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
