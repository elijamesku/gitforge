"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Search, GitFork, FileCode2, Code2 } from "lucide-react";

interface SearchResult {
  type: "repo" | "file" | "code";
  repo_user: string;
  repo_name: string;
  path: string | null;
  snippet: string | null;
  line: number | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) { setResults([]); return; }
    setLoading(true);
    fetch(`/api/rust/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => { setResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const icon = (type: string) => {
    switch (type) {
      case "repo": return <GitFork size={14} className="text-brand" />;
      case "file": return <FileCode2 size={14} className="text-foreground-lighter" />;
      case "code": return <Code2 size={14} className="text-foreground-muted" />;
      default: return null;
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search repositories, files, and code..."
              className="w-full rounded-lg border border-border bg-surface-100 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:brightness-110"
          >
            Search
          </button>
        </div>
      </form>

      {q && (
        <p className="mb-4 text-xs text-foreground-lighter">
          {loading ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"`}
        </p>
      )}

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {results.length === 0 && q && !loading && (
          <div className="p-8 text-center text-sm text-foreground-muted">
            No results found.
          </div>
        )}
        {results.map((r, i) => (
          <Link
            key={i}
            href={
              r.type === "repo"
                ? `/${r.repo_user}/${r.repo_name}`
                : `/${r.repo_user}/${r.repo_name}/blob/${r.path}`
            }
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-100"
          >
            <div className="mt-0.5">{icon(r.type)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-brand">{r.repo_user}/{r.repo_name}</span>
                {r.path && (
                  <>
                    <span className="text-foreground-muted">/</span>
                    <span className="truncate text-foreground-light">{r.path}</span>
                  </>
                )}
                {r.line && (
                  <span className="rounded bg-surface-200 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
                    L{r.line}
                  </span>
                )}
              </div>
              {r.snippet && (
                <pre className="mt-1 overflow-hidden truncate rounded bg-surface-200 px-2 py-1 font-mono text-[11px] text-foreground-lighter">
                  {r.snippet}
                </pre>
              )}
            </div>
            <span className="mt-0.5 rounded-full bg-surface-200 px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
              {r.type}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
