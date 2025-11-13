// components/Header.jsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { IconMenu2, IconX, IconLogout } from "@tabler/icons-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/briefings", label: "Briefings" },
  { href: "/explainers", label: "Explainers" },
  { href: "/lessons", label: "Lessons" },
];

export default function Header({ tenant = {}, user = {}, signOut = () => {} }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav
      className="fixed w-full top-0 left-0 right-0 h-16 flex items-center px-6 z-20 bg-white/70 backdrop-blur-md border-b border-gray-200/60 shadow-md"
      aria-label="Primary"
    >
      {/* CONSTRAINED & CENTERED CONTENT - Option A */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo + Desktop nav */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500
                           text-white flex items-center justify-center font-bold shadow-md"
                aria-hidden
              >
                {tenant?.name?.[0] ?? "I"}
              </div>
              <span className="hidden sm:inline-block text-lg sm:text-xl font-semibold text-gray-900">
                {tenant?.name ?? "Insight Studio"}
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-gray-700
                             rounded-lg hover:text-indigo-600 hover:bg-indigo-50
                             transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: user/email + mobile menu button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">
                  {user?.name ?? user?.email}
                </span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm
                           text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition inline-flex items-center gap-2"
                aria-label="Sign out"
                type="button"
              >
                <IconLogout size={16} stroke={1.5} />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setOpen((s) => !s)}
                aria-controls="mobile-menu"
                aria-expanded={open}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700
                           hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                type="button"
              >
                <span className="sr-only">
                  {open ? "Close menu" : "Open menu"}
                </span>
                {open ? (
                  <IconX size={20} stroke={1.5} aria-hidden />
                ) : (
                  <IconMenu2 size={20} stroke={1.5} aria-hidden />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-menu"
        className={`md:hidden origin-top transform transition-all duration-200 ease-in-out
                    ${
                      open
                        ? "opacity-100 scale-y-100"
                        : "opacity-0 scale-y-95 pointer-events-none"
                    }`}
        style={{ transformOrigin: "top" }}
      >
        <div className="mx-auto px-4 pt-2 pb-4 border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                {tenant?.name?.[0] ?? "I"}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {tenant?.name ?? "Insight Studio"}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="px-3 py-2 rounded-md text-sm bg-white border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition inline-flex items-center gap-2"
              type="button"
            >
              <IconLogout size={16} stroke={1.5} />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-gray-800 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
