import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepo } from "@/lib/db";
import { listFiles, listCommits, getDefaultBranch, getCommitCount, listBranches, repoExists, readFile } from "@/lib/git";
import FileTree from "@/components/FileTree";
import { GitBranch, GitCommitHorizontal, Code, BarChart3 } from "lucide-react";

type Params = { user: string; repo: string };

export default async function RepoPage({ params }: { params: Promise<Params> }) {
  const { user, repo } = await params;

  if (!(await repoExists(user, repo))) {
    notFound();
  }

  const [dbRepo, defaultBranch, files, commits, commitCount, branches] = await Promise.all([
    getRepo(user, repo),
    getDefaultBranch(user, repo),
    listFiles(user, repo),
    listCommits(user, repo, "HEAD", 1),
    getCommitCount(user, repo),
    listBranches(user, repo),
  ]);

  const isEmpty = files.length === 0;

  const readme = files.find(
    (f) => f.type === "blob" && f.name.toLowerCase() === "readme.md"
  );
  let readmeContent: string | null = null;
  if (readme) {
    const file = await readFile(user, repo, readme.name);
    if (file) readmeContent = file.content;
  }

  const tabs = [
    { label: "Code", href: `/${user}/${repo}`, icon: Code, active: true },
    { label: "Commits", href: `/${user}/${repo}/commits`, icon: GitCommitHorizontal, count: commitCount },
    { label: "Insights", href: `/${user}/${repo}/insights`, icon: BarChart3 },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-sm">
          <Link href={`/${user}`} className="text-brand hover:underline">{user}</Link>
          <span className="mx-1 text-foreground-muted">/</span>
          <span className="font-semibold text-foreground">{repo}</span>
        </h1>
        {dbRepo?.description && (
          <p className="mt-1 text-xs text-foreground-lighter">{dbRepo.description}</p>
        )}
      </div>

      <div className="mb-5 flex gap-0.5 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              tab.active
                ? "border-brand text-foreground"
                : "border-transparent text-foreground-lighter hover:border-foreground-muted hover:text-foreground-light"
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-surface-200 px-1.5 py-0.5 text-[10px] font-normal text-foreground-lighter">
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {!isEmpty && (
        <div className="mb-3 flex items-center gap-3 text-xs text-foreground-lighter">
          <span className="flex items-center gap-1.5">
            <GitBranch size={13} />
            <span className="rounded-md bg-surface-200 px-2 py-0.5 font-mono text-[11px] text-foreground-light">{defaultBranch}</span>
          </span>
          <span>
            {branches.length} {branches.length === 1 ? "branch" : "branches"}
          </span>
        </div>
      )}

      {isEmpty ? (
        <div className="rounded-lg border border-border bg-surface p-8">
          <h2 className="mb-3 text-sm font-medium">Quick setup</h2>
          <p className="mb-3 text-xs text-foreground-lighter">
            Push an existing repository from the command line:
          </p>
          <pre className="overflow-x-auto rounded-md bg-surface-200 p-4 font-mono text-xs text-foreground-light">
{`git remote add origin http://localhost:3002/api/git/${user}/${repo}
git push -u origin main`}
          </pre>
        </div>
      ) : (
        <>
          {commits[0] && (
            <Link
              href={`/${user}/${repo}/commit/${commits[0].sha}`}
              className="mb-px flex items-center gap-2 rounded-t-lg border border-border bg-surface-100 px-4 py-2 text-xs transition-colors hover:bg-surface-200"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-subtle text-[9px] font-bold text-brand">
                {commits[0].author[0].toUpperCase()}
              </div>
              <span className="font-medium text-foreground-light">{commits[0].author}</span>
              <span className="flex-1 truncate text-foreground-lighter">{commits[0].message}</span>
              <code className="font-mono text-[11px] text-foreground-muted">{commits[0].shortSha}</code>
              <span className="text-foreground-muted">{commits[0].relativeDate}</span>
            </Link>
          )}
          <FileTree files={files} user={user} repo={repo} />

          {readmeContent && (
            <div className="mt-5 rounded-lg border border-border bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium text-foreground-light">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.744 3.744 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
                </svg>
                README.md
              </h3>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground-light">
                {readmeContent}
              </pre>
            </div>
          )}
        </>
      )}
    </main>
  );
}
