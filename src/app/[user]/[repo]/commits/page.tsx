import Link from "next/link";
import { notFound } from "next/navigation";
import { repoExists, listCommits } from "@/lib/git";
import CommitList from "@/components/CommitList";

type Params = { user: string; repo: string };

export default async function CommitsPage({ params }: { params: Promise<Params> }) {
  const { user, repo } = await params;

  if (!(await repoExists(user, repo))) {
    notFound();
  }

  const commits = await listCommits(user, repo);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl">
          <Link href={`/${user}`} className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">
            {user}
          </Link>
          <span className="mx-1 text-zinc-400">/</span>
          <Link href={`/${user}/${repo}`} className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">
            {repo}
          </Link>
          <span className="mx-1 text-zinc-400">/</span>
          <span className="font-semibold">commits</span>
        </h1>
      </div>

      {commits.length === 0 ? (
        <p className="text-zinc-500">No commits yet.</p>
      ) : (
        <CommitList commits={commits} />
      )}
    </main>
  );
}
