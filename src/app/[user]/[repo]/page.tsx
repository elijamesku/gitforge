import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepo } from "@/lib/db";
import { listFiles, listCommits, getDefaultBranch, getCommitCount, listBranches, repoExists } from "@/lib/git";
import FileTree from "@/components/FileTree";
import { readFile } from "@/lib/git";

type Params = { user: string; repo: string };

export default async function RepoPage({ params }: { params: Promise<Params> }) {
  const { user, repo } = await params;

  if (!(await repoExists(user, repo))) {
    notFound();
  }

  const dbRepo = await getRepo(user, repo);
  const defaultBranch = await getDefaultBranch(user, repo);
  const files = await listFiles(user, repo);
  const commits = await listCommits(user, repo, "HEAD", 1);
  const commitCount = await getCommitCount(user, repo);
  const branches = await listBranches(user, repo);

  const isEmpty = files.length === 0;

  const readme = files.find(
    (f) => f.type === "blob" && f.name.toLowerCase() === "readme.md"
  );
  let readmeContent: string | null = null;
  if (readme) {
    const file = await readFile(user, repo, readme.name);
    if (file) readmeContent = file.content;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">
          <Link href={`/${user}`} className="text-emerald-600 hover:underline dark:text-emerald-400">
            {user}
          </Link>
          <span className="mx-1 text-zinc-400">/</span>
          <span>{repo}</span>
        </h1>
        {dbRepo?.description && (
          <p className="mt-1 text-sm text-zinc-500">{dbRepo.description}</p>
        )}
      </div>

      {!isEmpty && (
        <div className="mb-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-zinc-500" fill="currentColor">
              <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" />
            </svg>
            {branches.length} {branches.length === 1 ? "branch" : "branches"}
          </span>
          <Link
            href={`/${user}/${repo}/commits`}
            className="flex items-center gap-1.5 hover:text-emerald-600"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-zinc-500" fill="currentColor">
              <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
            </svg>
            {commitCount} {commitCount === 1 ? "commit" : "commits"}
          </Link>
        </div>
      )}

      {isEmpty ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold">Quick setup</h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Push an existing repository from the command line:
          </p>
          <pre className="overflow-x-auto rounded-md bg-zinc-100 p-4 font-mono text-sm dark:bg-zinc-800">
{`git remote add origin http://localhost:3002/api/git/${user}/${repo}
git push -u origin main`}
          </pre>
        </div>
      ) : (
        <>
          {commits[0] && (
            <div className="mb-2 flex items-center gap-3 rounded-t-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-800/50">
              <span className="font-medium">{commits[0].author}</span>
              <span className="flex-1 truncate text-zinc-500">{commits[0].message}</span>
              <code className="font-mono text-xs text-zinc-400">{commits[0].shortSha}</code>
              <span className="text-xs text-zinc-400">{commits[0].relativeDate}</span>
            </div>
          )}
          <FileTree files={files} user={user} repo={repo} />

          {readmeContent && (
            <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
                  <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.744 3.744 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
                </svg>
                README.md
              </h3>
              <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-700 dark:text-zinc-300">
                {readmeContent}
              </pre>
            </div>
          )}
        </>
      )}
    </main>
  );
}
