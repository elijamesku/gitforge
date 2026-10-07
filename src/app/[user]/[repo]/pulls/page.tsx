"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { GitPullRequest, GitMerge, CircleX } from "lucide-react";

interface PR {
  id: number;
  number: number;
  title: string;
  state: string;
  head_branch: string;
  base_branch: string;
  author: string;
  created_at: string;
  merged_at: string | null;
}

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} minutes ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}

export default function PullsPage() {
  const { user, repo } = useParams<{ user: string; repo: string }>();
  const [prs, setPrs] = useState<PR[]>([]);
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rust/repos/${user}/${repo}/pulls?state=${filter}`)
      .then((r) => r.json())
      .then((data) => { setPrs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, repo, filter]);

  const stateIcon = (pr: PR) => {
    if (pr.state === "merged") return <GitMerge size={16} className="text-purple-500" />;
    if (pr.state === "closed") return <CircleX size={16} className="text-red-400" />;
    return <GitPullRequest size={16} className="text-green-500" />;
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-1 text-xs text-foreground-lighter">
            <Link href={`/${user}`} className="text-brand hover:underline">{user}</Link>
            <span className="mx-1 text-foreground-muted">/</span>
            <Link href={`/${user}/${repo}`} className="text-brand hover:underline">{repo}</Link>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Pull Requests</h1>
        </div>
      </div>

      <div className="mb-4 flex gap-4 border-b border-border">
        <button
          onClick={() => setFilter("open")}
          className={`flex items-center gap-1.5 border-b-2 px-1 pb-2 text-xs font-medium transition-colors ${
            filter === "open"
              ? "border-brand text-foreground"
              : "border-transparent text-foreground-lighter hover:text-foreground-light"
          }`}
        >
          <GitPullRequest size={14} />
          Open
        </button>
        <button
          onClick={() => setFilter("closed")}
          className={`flex items-center gap-1.5 border-b-2 px-1 pb-2 text-xs font-medium transition-colors ${
            filter === "closed"
              ? "border-brand text-foreground"
              : "border-transparent text-foreground-lighter hover:text-foreground-light"
          }`}
        >
          <GitMerge size={14} />
          Closed
        </button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {loading && (
          <div className="p-8 text-center text-sm text-foreground-muted">Loading...</div>
        )}
        {!loading && prs.length === 0 && (
          <div className="p-8 text-center">
            <GitPullRequest size={32} className="mx-auto mb-3 text-foreground-muted" />
            <p className="text-sm text-foreground-muted">
              No {filter} pull requests.
            </p>
          </div>
        )}
        {prs.map((pr) => (
          <Link
            key={pr.id}
            href={`/${user}/${repo}/pulls/${pr.number}`}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-100"
          >
            <div className="mt-0.5">{stateIcon(pr)}</div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-foreground hover:text-brand">
                {pr.title}
              </span>
              <p className="mt-0.5 text-[11px] text-foreground-muted">
                #{pr.number} {pr.state === "merged" ? "merged" : "opened"} {timeAgo(pr.merged_at || pr.created_at)} by {pr.author}
              </p>
              <p className="mt-0.5 text-[10px] font-mono text-foreground-muted">
                <span className="rounded bg-surface-200 px-1.5 py-0.5">{pr.head_branch}</span>
                <span className="mx-1">&larr;</span>
                <span className="rounded bg-surface-200 px-1.5 py-0.5">{pr.base_branch}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
