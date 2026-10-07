import Link from "next/link";
import { notFound } from "next/navigation";
import { repoExists, listCommits, getCommitCount } from "@/lib/git";
import CommitList from "@/components/CommitList";
import { Code, GitCommitHorizontal, BarChart3 } from "lucide-react";

type Params = { user: string; repo: string };

export default async function CommitsPage({ params }: { params: Promise<Params> }) {
  const { user, repo } = await params;

  if (!(await repoExists(user, repo))) {
    notFound();
  }

  const [commits, commitCount] = await Promise.all([
    listCommits(user, repo),
    getCommitCount(user, repo),
  ]);

  const tabs = [
    { label: "Code", href: `/${user}/${repo}`, icon: Code },
    { label: "Commits", href: `/${user}/${repo}/commits`, icon: GitCommitHorizontal, count: commitCount, active: true },
    { label: "Insights", href: `/${user}/${repo}/insights`, icon: BarChart3 },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-sm">
          <Link href={`/${user}`} className="text-brand hover:underline">{user}</Link>
          <span className="mx-1 text-foreground-muted">/</span>
          <Link href={`/${user}/${repo}`} className="text-brand hover:underline">{repo}</Link>
        </h1>
      </div>

      <div className="mb-5 flex gap-0.5 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              tab.active
                ? "border-brand text-foreground"
                : "border-transparent text-foreground-lighter hover:border-foreground-muted hover:text-foreground-light"
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-surface-200 px-1.5 py-0.5 text-[10px] font-normal text-foreground-lighter">
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {commits.length === 0 ? (
        <p className="text-xs text-foreground-muted">No commits yet.</p>
      ) : (
        <CommitList commits={commits} user={user} repo={repo} />
      )}
    </main>
  );
}
