import type { Commit } from "@/lib/git";

export default function CommitList({ commits }: { commits: Commit[] }) {
  return (
    <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {commits.map((commit) => (
        <div key={commit.sha} className="flex items-start justify-between px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
              {commit.message}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {commit.author} committed {commit.relativeDate}
            </p>
          </div>
          <code className="ml-4 shrink-0 rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {commit.shortSha}
          </code>
        </div>
      ))}
    </div>
  );
}
