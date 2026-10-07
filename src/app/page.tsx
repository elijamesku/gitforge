import Link from "next/link";
import { listRepos } from "@/lib/db";
import { GitBranch, Eye, BarChart3 } from "lucide-react";

export default async function Home() {
  const repos = await listRepos();

  return (
    <main>
      <div className="relative overflow-hidden border-b border-border bg-surface">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-subtle via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-subtle px-4 py-1.5 text-xs text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Built from scratch
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Your code,{" "}
            <span className="bg-gradient-to-r from-brand to-orange-400 bg-clip-text text-transparent">
              your forge.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-foreground-lighter">
            A complete git forge built from the ground up. Smart HTTP protocol,
            syntax highlighting, commit diffs, real-time insights.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/new"
              className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-110"
            >
              Create a repository
            </Link>
            <Link
              href="/explore"
              className="rounded-md border border-border bg-surface px-5 py-2 text-sm font-medium text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground"
            >
              Explore
            </Link>
          </div>

          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-8 text-left">
            <div className="rounded-lg border border-border bg-surface/80 p-4">
              <GitBranch size={18} className="mb-2 text-brand" />
              <div className="text-sm font-medium text-foreground">Git Protocol</div>
              <div className="mt-0.5 text-xs text-foreground-lighter">Smart HTTP push & pull</div>
            </div>
            <div className="rounded-lg border border-border bg-surface/80 p-4">
              <Eye size={18} className="mb-2 text-brand" />
              <div className="text-sm font-medium text-foreground">Syntax Highlighting</div>
              <div className="mt-0.5 text-xs text-foreground-lighter">30+ languages via Shiki</div>
            </div>
            <div className="rounded-lg border border-border bg-surface/80 p-4">
              <BarChart3 size={18} className="mb-2 text-brand" />
              <div className="text-sm font-medium text-foreground">Insights</div>
              <div className="mt-0.5 text-xs text-foreground-lighter">Activity dashboard</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {repos.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground-lighter">
              Recent repositories
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {repos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/${repo.user}/${repo.name}`}
                  className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-surface-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand" />
                    <span className="text-sm font-medium text-brand group-hover:underline">
                      {repo.user}/{repo.name}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="mt-1.5 text-xs text-foreground-lighter line-clamp-2">{repo.description}</p>
                  )}
                  <div className="mt-3 text-[10px] font-mono uppercase text-foreground-muted">
                    {repo.visibility}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
