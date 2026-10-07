import Link from "next/link";
import { listRepos } from "@/lib/db";
import { getContributionData, getCommitCount } from "@/lib/git";
import { notFound } from "next/navigation";
import ContributionGraph from "@/components/ContributionGraph";

type Params = { user: string };

export default async function UserPage({ params }: { params: Promise<Params> }) {
  const { user } = await params;
  const repos = await listRepos(user);

  if (repos.length === 0) {
    notFound();
  }

  const contributionData = await getContributionData(user);

  const repoStats = await Promise.all(
    repos.map(async (repo) => {
      const commits = await getCommitCount(user, repo.name);
      return { ...repo, commits };
    })
  );

  const totalCommits = repoStats.reduce((sum, r) => sum + r.commits, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-start gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-orange-400 text-2xl font-bold text-white">
          {user[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">{user}</h1>
          <div className="mt-1.5 flex gap-4 text-xs text-foreground-lighter">
            <span>
              <span className="font-medium text-foreground">{repos.length}</span>{" "}
              {repos.length === 1 ? "repository" : "repositories"}
            </span>
            <span>
              <span className="font-medium text-foreground">{totalCommits}</span>{" "}
              {totalCommits === 1 ? "commit" : "commits"}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-lighter">
          Contributions
        </h2>
        <ContributionGraph data={contributionData} />
      </div>

      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-lighter">
        Repositories
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {repoStats.map((repo) => (
          <Link
            key={repo.id}
            href={`/${repo.user}/${repo.name}`}
            className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-surface-100"
          >
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-brand group-hover:underline">
                {repo.name}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono uppercase text-foreground-muted">
                {repo.visibility}
              </span>
            </div>
            {repo.description && (
              <p className="mt-1.5 text-xs text-foreground-lighter line-clamp-2">{repo.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-foreground-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {repo.commits} commits
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
