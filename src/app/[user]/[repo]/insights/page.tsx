import Link from "next/link";
import { notFound } from "next/navigation";
import { repoExists, listCommits, getCommitCount, listBranches } from "@/lib/git";
import Dashboard from "@/components/Dashboard";
import { Code, GitCommitHorizontal, BarChart3, GitBranch, Users, Clock } from "lucide-react";

type Params = { user: string; repo: string };

export default async function InsightsPage({ params }: { params: Promise<Params> }) {
  const { user, repo } = await params;

  if (!(await repoExists(user, repo))) {
    notFound();
  }

  const [commits, commitCount, branches] = await Promise.all([
    listCommits(user, repo, "HEAD", 10),
    getCommitCount(user, repo),
    listBranches(user, repo),
  ]);

  const tabs = [
    { label: "Code", href: `/${user}/${repo}`, icon: Code },
    { label: "Commits", href: `/${user}/${repo}/commits`, icon: GitCommitHorizontal, count: commitCount },
    { label: "Insights", href: `/${user}/${repo}/insights`, icon: BarChart3, active: true },
  ];

  const contributorCount = commits.length > 0 ? new Set(commits.map((c) => c.author)).size : 0;

  const stats = [
    { label: "Total Commits", value: String(commitCount), icon: GitCommitHorizontal },
    { label: "Branches", value: String(branches.length), icon: GitBranch },
    { label: "Contributors", value: String(contributorCount), icon: Users },
    { label: "Last Activity", value: commits[0]?.relativeDate || "—", icon: Clock },
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

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-surface p-4">
            <stat.icon size={14} className="mb-2 text-foreground-muted" />
            <div className="text-lg font-semibold text-foreground">{stat.value}</div>
            <div className="text-[10px] font-mono uppercase text-foreground-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <Dashboard />

      {commits.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-lighter">
            Recent Commits
          </h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
            {commits.map((commit) => (
              <Link
                key={commit.sha}
                href={`/${user}/${repo}/commit/${commit.sha}`}
                className="flex items-start justify-between px-4 py-3 transition-colors hover:bg-surface-100"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{commit.message}</p>
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
        </div>
      )}
    </main>
  );
}
