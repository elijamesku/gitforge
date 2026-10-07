"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CircleDot, CheckCircle2, Tag } from "lucide-react";
import MarkdownView from "@/components/MarkdownView";

interface IssueComment {
  id: number;
  author: string;
  body: string;
  created_at: string;
}

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
  comments: IssueComment[];
}

const LABEL_COLORS: Record<string, string> = {
  bug: "bg-red-500/20 text-red-400 border-red-500/30",
  enhancement: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  documentation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} minutes ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}

export default function IssuePage() {
  const params = useParams<{ user: string; repo: string; number: string }>();
  const router = useRouter();
  const { user, repo, number } = params;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/rust/repos/${user}/${repo}/issues/${number}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setIssue)
      .catch(() => setIssue(null));
  }, [user, repo, number]);

  const toggleState = async () => {
    if (!issue) return;
    const newState = issue.state === "open" ? "closed" : "open";
    const res = await fetch(`/api/rust/repos/${user}/${repo}/issues/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newState }),
    });
    if (res.ok) setIssue(await res.json());
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/rust/repos/${user}/${repo}/issues/${number}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: comment, author: "eli" }),
    });
    if (res.ok) {
      setComment("");
      const updated = await fetch(`/api/rust/repos/${user}/${repo}/issues/${number}`);
      if (updated.ok) setIssue(await updated.json());
    }
    setSubmitting(false);
  };

  if (!issue) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-foreground-muted">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-1 text-xs text-foreground-lighter">
        <Link href={`/${user}`} className="text-brand hover:underline">{user}</Link>
        <span className="mx-1 text-foreground-muted">/</span>
        <Link href={`/${user}/${repo}`} className="text-brand hover:underline">{repo}</Link>
        <span className="mx-1 text-foreground-muted">/</span>
        <Link href={`/${user}/${repo}/issues`} className="text-brand hover:underline">Issues</Link>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <h1 className="flex-1 text-xl font-semibold text-foreground">
          {issue.title}
          <span className="ml-2 text-foreground-muted font-normal">#{issue.number}</span>
        </h1>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
          issue.state === "open"
            ? "bg-green-500/20 text-green-400"
            : "bg-purple-500/20 text-purple-400"
        }`}>
          {issue.state === "open" ? <CircleDot size={12} /> : <CheckCircle2 size={12} />}
          {issue.state === "open" ? "Open" : "Closed"}
        </span>
        <span className="text-xs text-foreground-muted">
          {issue.author} opened this issue {timeAgo(issue.created_at)}
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

      <div className="mt-6 space-y-4">
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border bg-surface-100 px-4 py-2">
            <span className="text-xs font-medium text-foreground-light">{issue.author}</span>
            <span className="text-[11px] text-foreground-muted">{timeAgo(issue.created_at)}</span>
          </div>
          <div className="px-4 py-3">
            {issue.body ? (
              <MarkdownView content={issue.body} />
            ) : (
              <p className="text-xs italic text-foreground-muted">No description provided.</p>
            )}
          </div>
        </div>

        {issue.comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border bg-surface-100 px-4 py-2">
              <span className="text-xs font-medium text-foreground-light">{c.author}</span>
              <span className="text-[11px] text-foreground-muted">{timeAgo(c.created_at)}</span>
            </div>
            <div className="px-4 py-3">
              <MarkdownView content={c.body} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <form onSubmit={submitComment}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment..."
            rows={4}
            className="w-full resize-none rounded-md border border-border bg-surface-100 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={toggleState}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                issue.state === "open"
                  ? "border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  : "border-green-500/30 text-green-400 hover:bg-green-500/10"
              }`}
            >
              {issue.state === "open" ? "Close issue" : "Reopen issue"}
            </button>
            <button
              type="submit"
              disabled={!comment.trim() || submitting}
              className="rounded-md bg-brand px-4 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50"
            >
              Comment
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
