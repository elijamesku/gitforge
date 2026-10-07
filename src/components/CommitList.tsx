import Link from "next/link";
import type { Commit } from "@/lib/git";

export default function CommitList({
  commits,
  user,
  repo,
}: {
  commits: Commit[];
  user: string;
  repo: string;
}) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-surface">
      {commits.map((commit) => (
        <Link
          key={commit.sha}
          href={`/${user}/${repo}/commit/${commit.sha}`}
          className="flex items-start justify-between px-4 py-3 transition-colors hover:bg-surface-100"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {commit.message}
            </p>
            <p className="mt-0.5 text-[10px] text-foreground-muted">
              {commit.author} committed {commit.relativeDate}
            </p>
          </div>
          <code className="ml-3 shrink-0 rounded bg-surface-200 px-1.5 py-0.5 font-mono text-[10px] text-foreground-lighter">
            {commit.shortSha}
          </code>
        </Link>
      ))}
    </div>
  );
}
