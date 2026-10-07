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
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5">
        <h1 className="flex items-center gap-1 text-sm">
          <Link href={`/${user}`} className="text-brand hover:underline">
            {user}
          </Link>
          <span className="text-foreground-muted">/</span>
          <Link href={`/${user}/${repo}`} className="text-brand hover:underline">
            {repo}
          </Link>
          {breadcrumbs.map((segment, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-foreground-muted">/</span>
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-foreground">{segment}</span>
              ) : (
                <Link
                  href={`/${user}/${repo}/tree/${breadcrumbs.slice(0, i + 1).join("/")}`}
                  className="text-brand hover:underline"
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
