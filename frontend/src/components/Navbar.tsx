"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api, NotificationData } from "@/lib/api";

const navLinks = [
  { href: "/dashboard", label: "Mission Control" },
  { href: "/records", label: "Records" },
  { href: "/providers", label: "Care Team" },
  { href: "/integrations", label: "Signals" },
  { href: "/settings", label: "Settings" },
];

function LogoMark() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-300 to-violet-400 shadow-[0_0_24px_rgba(104,240,216,0.35)]">
      <div className="absolute inset-[1px] rounded-[15px] bg-slate-950/90" />
      <svg className="relative z-10 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (user) {
      api.notifications().then(setNotifications).catch(() => {
        toast.error("Failed to load notifications");
      });
    }
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && notifOpen) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [notifOpen]);

  const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !notifDropdownRef.current) return;

    const focusableElements = notifDropdownRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else if (document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);

  const handleMarkRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : "MB";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/65 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-3">
              <LogoMark />
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/70">MedBridge</div>
                <div className="text-xs text-slate-400">Unified care intelligence</div>
              </div>
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-slate-300 lg:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.85)]" />
              Live sync fabric active
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition-all ${
                    active
                      ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(103,232,249,0.24)]"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                aria-expanded={notifOpen}
                className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-rose-400 to-orange-300 px-1 text-[10px] font-bold text-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="glass-panel absolute right-0 top-14 z-50 w-96 overflow-hidden rounded-3xl"
                    ref={notifDropdownRef}
                    onKeyDown={handleDropdownKeyDown}
                  >
                    <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                      <div>
                        <div className="text-sm font-semibold text-white">Notification stream</div>
                        <div className="text-xs text-slate-400">System events, provider activity, and alerts</div>
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs font-medium text-cyan-300 transition-colors hover:text-cyan-200">
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto" role="menu">
                      {notifications.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-slate-400">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleMarkRead(n.id)}
                            role="menuitem"
                            className={`block w-full border-b border-white/6 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] ${
                              !n.read ? "bg-cyan-400/[0.06]" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`mt-1 h-2.5 w-2.5 rounded-full ${
                                  n.read ? "bg-slate-600" : "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]"
                                }`}
                              />
                              <div>
                                <div className="text-sm font-medium text-white">{n.title}</div>
                                <div className="mt-1 text-xs leading-relaxed text-slate-400">{n.message}</div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 sm:flex">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-teal-300 to-violet-400 text-sm font-semibold text-slate-950"
                aria-label={`User menu for ${user?.first_name ?? ""} ${user?.last_name ?? ""}`}
              >
                {initials}
              </div>
              <div className="max-w-[10rem] pr-1">
                <div className="truncate text-sm font-medium text-white">
                  {user ? `${user.first_name} ${user.last_name}` : "Guest user"}
                </div>
                <div className="truncate text-xs text-slate-400">{user?.role ?? "Patient"}</div>
              </div>
              <button
                onClick={logout}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Sign out
              </button>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="glass-panel fixed inset-x-4 top-[4.5rem] z-40 rounded-3xl md:hidden"
          >
            <div className="space-y-2 px-4 py-4">
              <div className="mb-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/60">Live fabric</div>
                <div className="mt-1 text-sm text-slate-300">Records, portals, and provider access synced from one surface.</div>
              </div>

              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-2xl px-4 py-3 text-sm transition-colors ${
                      active
                        ? "bg-cyan-400/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(103,232,249,0.22)]"
                        : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="block w-full rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] px-4 py-3 text-left text-sm text-rose-200 transition-colors hover:bg-rose-500/[0.12]"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
