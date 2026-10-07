"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { GitPullRequest, GitMerge, CircleX } from "lucide-react";
import MarkdownView from "@/components/MarkdownView";

interface PR {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  head_branch: string;
  base_branch: string;
  author: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
}

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} minutes ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}

export default function PullDetailPage() {
  const { user, repo, number } = useParams<{ user: string; repo: string; number: string }>();
  const [pr, setPr] = useState<PR | null>(null);

  useEffect(() => {
    fetch(`/api/rust/repos/${user}/${repo}/pulls/${number}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setPr)
      .catch(() => setPr(null));
  }, [user, repo, number]);

  const handleMerge = async () => {
    const res = await fetch(`/api/rust/repos/${user}/${repo}/pulls/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "merged" }),
    });
    if (res.ok) setPr(await res.json());
  };

  const handleClose = async () => {
    const res = await fetch(`/api/rust/repos/${user}/${repo}/pulls/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "closed" }),
    });
    if (res.ok) setPr(await res.json());
  };

  if (!pr) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-foreground-muted">Loading...</p>
      </main>
    );
  }

  const stateColor = pr.state === "merged"
    ? "bg-purple-500/20 text-purple-400"
    : pr.state === "closed"
    ? "bg-red-500/20 text-red-400"
    : "bg-green-500/20 text-green-400";

  const StateIcon = pr.state === "merged" ? GitMerge : pr.state === "closed" ? CircleX : GitPullRequest;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-1 text-xs text-foreground-lighter">
        <Link href={`/${user}`} className="text-brand hover:underline">{user}</Link>
        <span className="mx-1 text-foreground-muted">/</span>
        <Link href={`/${user}/${repo}`} className="text-brand hover:underline">{repo}</Link>
        <span className="mx-1 text-foreground-muted">/</span>
        <Link href={`/${user}/${repo}/pulls`} className="text-brand hover:underline">Pull Requests</Link>
      </div>

      <h1 className="mt-3 text-xl font-semibold text-foreground">
        {pr.title}
        <span className="ml-2 font-normal text-foreground-muted">#{pr.number}</span>
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${stateColor}`}>
          <StateIcon size={12} />
          {pr.state.charAt(0).toUpperCase() + pr.state.slice(1)}
        </span>
        <span className="text-xs text-foreground-muted">
          {pr.author} wants to merge
          <code className="mx-1 rounded bg-surface-200 px-1.5 py-0.5 font-mono text-[11px]">{pr.head_branch}</code>
          into
          <code className="ml-1 rounded bg-surface-200 px-1.5 py-0.5 font-mono text-[11px]">{pr.base_branch}</code>
        </span>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border bg-surface-100 px-4 py-2">
          <span className="text-xs font-medium text-foreground-light">{pr.author}</span>
          <span className="text-[11px] text-foreground-muted">{timeAgo(pr.created_at)}</span>
        </div>
        <div className="px-4 py-3">
          {pr.body ? (
            <MarkdownView content={pr.body} />
          ) : (
            <p className="text-xs italic text-foreground-muted">No description provided.</p>
          )}
        </div>
      </div>

      {pr.state === "open" && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            Close pull request
          </button>
          <button
            onClick={handleMerge}
            className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-500"
          >
            Merge pull request
          </button>
        </div>
      )}

      {pr.merged_at && (
        <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <GitMerge size={16} />
            <span className="font-medium">{pr.author}</span> merged this pull request {timeAgo(pr.merged_at)}
          </div>
        </div>
      )}
    </main>
  );
}
