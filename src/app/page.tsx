import Link from "next/link";
import { listRepos } from "@/lib/db";

export default async function Home() {
  const repos = await listRepos();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your code, your forge.
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          A git forge built from scratch. Push, browse, collaborate.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/new"
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Create a repository
          </Link>
        </div>
      </div>

      {repos.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent repositories</h2>
          <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {repos.map((repo) => (
              <Link
                key={repo.id}
                href={`/${repo.user}/${repo.name}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {repo.user}/{repo.name}
                  </span>
                  {repo.description && (
                    <p className="mt-0.5 text-sm text-zinc-500">{repo.description}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-400">{repo.visibility}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
