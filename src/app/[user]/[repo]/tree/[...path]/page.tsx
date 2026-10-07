import Link from "next/link";
import { notFound } from "next/navigation";
import { repoExists, listFiles } from "@/lib/git";
import FileTree from "@/components/FileTree";

type Params = { user: string; repo: string; path: string[] };

export default async function TreePage({ params }: { params: Promise<Params> }) {
  const { user, repo, path: pathSegments } = await params;
  const dirPath = pathSegments.join("/");

  if (!(await repoExists(user, repo))) {
    notFound();
  }

  const files = await listFiles(user, repo, "HEAD", dirPath);
  if (files.length === 0) {
    notFound();
  }

  const breadcrumbs = dirPath.split("/");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-1 text-xl">
          <Link href={`/${user}`} className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">
            {user}
          </Link>
          <span className="text-zinc-400">/</span>
          <Link href={`/${user}/${repo}`} className="font-bold text-emerald-600 hover:underline dark:text-emerald-400">
            {repo}
          </Link>
          {breadcrumbs.map((segment, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-zinc-400">/</span>
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold">{segment}</span>
              ) : (
                <Link
                  href={`/${user}/${repo}/tree/${breadcrumbs.slice(0, i + 1).join("/")}`}
                  className="text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  {segment}
                </Link>
              )}
            </span>
          ))}
        </h1>
      </div>

      <FileTree files={files} user={user} repo={repo} />
    </main>
  );
}
