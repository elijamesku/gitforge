"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Anvil, Settings, Search, Bell } from "lucide-react";

export default function Nav() {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") setShowSearch(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (showSearch && inputRef.current) inputRef.current.focus();
  }, [showSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSearch(false);
      setQuery("");
    }
  };

  return (
    <>
      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Anvil size={20} className="text-brand" />
              Forge
            </Link>
            <Link
              href="/explore"
              className="text-xs text-foreground-lighter transition-colors hover:text-foreground"
            >
              Explore
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="hidden items-center gap-2 rounded-md border border-border bg-surface-100 px-3 py-1 text-xs text-foreground-muted transition-colors hover:border-foreground-muted sm:flex"
            >
              <Search size={12} />
              Search or jump to...
              <kbd className="ml-2 rounded border border-border bg-surface-200 px-1.5 py-0.5 font-mono text-[10px]">
                /
              </kbd>
            </button>
            <Link
              href="/notifications"
              className="relative rounded-md p-1.5 text-foreground-muted transition-colors hover:text-foreground"
            >
              <Bell size={16} />
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-[8px] font-bold text-white">
                3
              </span>
            </Link>
            <Link
              href="/settings"
              className="rounded-md p-1.5 text-foreground-muted transition-colors hover:text-foreground"
            >
              <Settings size={16} />
            </Link>
            <Link
              href="/new"
              className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white transition-colors hover:brightness-110"
            >
              New repository
            </Link>
          </div>
        </div>
      </nav>

      {showSearch && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]"
          onClick={() => setShowSearch(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-surface p-0 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Search size={16} className="text-foreground-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search repositories, files, and code..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-muted focus:outline-none"
                />
                <kbd className="rounded border border-border bg-surface-200 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
                  ESC
                </kbd>
              </div>
            </form>
            <div className="px-4 py-3 text-[11px] text-foreground-muted">
              Type to search across all repositories, files, and code.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
