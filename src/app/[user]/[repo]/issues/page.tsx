"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { CircleDot, CheckCircle2, MessageSquare, Tag, Plus } from "lucide-react";

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  labels: string[];
  author: string;
  created_at: string;
  updated_at: string;
  comments: { id: number }[];
}

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-500/20 text-red-400 border-red-500/30",
  enhancement: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  documentation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "good first issue": "bg-green-500/20 text-green-400 border-green-500/30",
  question: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} minutes ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}

export default function IssuesPage() {
  const { user, repo } = useParams<{ user: string; repo: string }>();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rust/repos/${user}/${repo}/issues?state=${filter}`)
      .then((r) => r.json())
      .then((data) => { setIssues(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, repo, filter]);

  const openCount = issues.length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-1 text-xs text-foreground-lighter">
            <Link href={`/${user}`} className="text-brand hover:underline">{user}</Link>
            <span className="mx-1 text-foreground-muted">/</span>
            <Link href={`/${user}/${repo}`} className="text-brand hover:underline">{repo}</Link>
          </div>
          <h1 className="text-lg font-semibold text-foreground">Issues</h1>
        </div>
        <Link
          href={`/${user}/${repo}/issues/new`}
          className="flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-110"
        >
          <Plus size={14} />
          New issue
        </Link>
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
          <CircleDot size={14} />
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
          <CheckCircle2 size={14} />
          Closed
        </button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {loading && (
          <div className="p-8 text-center text-sm text-foreground-muted">Loading...</div>
        )}
        {!loading && issues.length === 0 && (
          <div className="p-8 text-center">
            <CircleDot size={32} className="mx-auto mb-3 text-foreground-muted" />
            <p className="text-sm text-foreground-muted">
              No {filter} issues.
            </p>
          </div>
        )}
        {issues.map((issue) => (
          <Link
            key={issue.id}
            href={`/${user}/${repo}/issues/${issue.number}`}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-100"
          >
            {issue.state === "open" ? (
              <CircleDot size={16} className="mt-0.5 shrink-0 text-green-500" />
            ) : (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-purple-500" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground hover:text-brand">
                  {issue.title}
                </span>
                {issue.labels.map((label) => (
                  <span
                    key={label}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      LABEL_COLORS[label] || "bg-surface-200 text-foreground-lighter border-border"
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-0.5 text-[11px] text-foreground-muted">
                #{issue.number} opened {timeAgo(issue.created_at)} by {issue.author}
              </p>
            </div>
            {issue.comments.length > 0 && (
              <div className="flex items-center gap-1 text-foreground-muted">
                <MessageSquare size={12} />
                <span className="text-[11px]">{issue.comments.length}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
