import Link from "next/link";
import { notFound } from "next/navigation";
import { repoExists, getCommit, getCommitDiff, getDiffStats } from "@/lib/git";
import DiffView from "@/components/DiffView";

type Params = { user: string; repo: string; sha: string };

export default async function CommitPage({ params }: { params: Promise<Params> }) {
  const { user, repo, sha } = await params;

  if (!(await repoExists(user, repo))) {
    notFound();
  }

  const [commit, diff, stats] = await Promise.all([
    getCommit(user, repo, sha),
    getCommitDiff(user, repo, sha),
    getDiffStats(user, repo, sha),
  ]);

  if (!commit) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-1 text-xs text-foreground-lighter">
        <Link href={`/${user}`} className="text-brand hover:underline">{user}</Link>
        <span className="mx-1 text-foreground-muted">/</span>
        <Link href={`/${user}/${repo}`} className="text-brand hover:underline">{repo}</Link>
        <span className="mx-1 text-foreground-muted">/</span>
        <Link href={`/${user}/${repo}/commits`} className="text-brand hover:underline">commits</Link>
        <span className="mx-1 text-foreground-muted">/</span>
        <span className="text-foreground-light">{commit.shortSha}</span>
      </div>

      <div className="mb-5 mt-4 rounded-lg border border-border bg-surface p-4">
        <h1 className="mb-2 text-sm font-medium text-foreground">{commit.message}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-lighter">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-subtle text-[9px] font-bold text-brand">
              {commit.author[0].toUpperCase()}
            </div>
            <span className="font-medium text-foreground-light">{commit.author}</span>
          </div>
          <span>committed {commit.relativeDate}</span>
          <code className="rounded bg-surface-200 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">{commit.sha}</code>
        </div>
        <div className="mt-2.5 flex gap-3 text-[10px] font-mono text-foreground-muted">
          <span>{stats.files} files changed</span>
          <span className="text-brand">+{stats.additions}</span>
          <span className="text-destructive">-{stats.deletions}</span>
        </div>
      </div>

      <DiffView files={diff} />
    </main>
  );
}
