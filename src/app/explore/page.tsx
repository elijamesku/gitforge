import Link from "next/link";
import { listRepos } from "@/lib/db";

export default async function ExplorePage() {
  const repos = await listRepos();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-lg font-semibold text-foreground">Explore</h1>
      <p className="mb-6 text-xs text-foreground-lighter">Discover repositories on Forge.</p>

      {repos.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-xs text-foreground-muted">No public repositories yet.</p>
          <Link
            href="/new"
            className="mt-3 inline-block rounded-md bg-brand px-4 py-1.5 text-xs font-medium text-white hover:brightness-110"
          >
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {repos.map((repo) => (
            <Link
              key={repo.id}
              href={`/${repo.user}/${repo.name}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-100"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  <span className="text-xs font-medium text-brand">
                    {repo.user}/{repo.name}
                  </span>
                </div>
                {repo.description && (
                  <p className="mt-0.5 pl-[18px] text-xs text-foreground-lighter">{repo.description}</p>
                )}
              </div>
              <span className="text-[10px] font-mono text-foreground-muted">
                {new Date(repo.updated_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
