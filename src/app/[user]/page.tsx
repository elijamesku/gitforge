import Link from "next/link";
import { listRepos } from "@/lib/db";
import { notFound } from "next/navigation";

type Params = { user: string };

export default async function UserPage({ params }: { params: Promise<Params> }) {
  const { user } = await params;
  const repos = await listRepos(user);

  if (repos.length === 0) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          {user[0].toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold">{user}</h1>
      </div>

      <h2 className="mb-3 text-sm font-medium text-zinc-500">Repositories</h2>
      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {repos.map((repo) => (
          <Link
            key={repo.id}
            href={`/${repo.user}/${repo.name}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <div>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {repo.name}
              </span>
              {repo.description && (
                <p className="mt-0.5 text-sm text-zinc-500">{repo.description}</p>
              )}
            </div>
            <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 dark:border-zinc-700">
              {repo.visibility}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
