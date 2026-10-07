import Link from "next/link";
import { notFound } from "next/navigation";
import { repoExists, readFile } from "@/lib/git";
import CodeView from "@/components/CodeView";

type Params = { user: string; repo: string; path: string[] };

export default async function BlobPage({ params }: { params: Promise<Params> }) {
  const { user, repo, path: pathSegments } = await params;
  const filePath = pathSegments.join("/");

  if (!(await repoExists(user, repo))) {
    notFound();
  }

  const file = await readFile(user, repo, filePath);
  if (!file) {
    notFound();
  }

  const breadcrumbs = filePath.split("/");
  const filename = breadcrumbs[breadcrumbs.length - 1];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="flex flex-wrap items-center gap-1 text-xl">
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

      <CodeView content={file.content} filename={filename} />
    </main>
  );
}
