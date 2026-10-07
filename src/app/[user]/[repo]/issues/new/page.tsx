"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function NewIssuePage() {
  const { user, repo } = useParams<{ user: string; repo: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/rust/repos/${user}/${repo}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body, author: "eli" }),
    });
    if (res.ok) {
      const issue = await res.json();
      router.push(`/${user}/${repo}/issues/${issue.number}`);
    }
    setSubmitting(false);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 text-xs text-foreground-lighter">
        <Link href={`/${user}`} className="text-brand hover:underline">{user}</Link>
        <span className="mx-1 text-foreground-muted">/</span>
        <Link href={`/${user}/${repo}`} className="text-brand hover:underline">{repo}</Link>
        <span className="mx-1 text-foreground-muted">/</span>
        <Link href={`/${user}/${repo}/issues`} className="text-brand hover:underline">Issues</Link>
      </div>

      <h1 className="mb-5 text-lg font-semibold text-foreground">New issue</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-border bg-surface-100 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          autoFocus
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Leave a comment (supports Markdown)"
          rows={10}
          className="w-full resize-none rounded-lg border border-border bg-surface-100 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50"
          >
            Submit new issue
          </button>
        </div>
      </form>
    </main>
  );
}
