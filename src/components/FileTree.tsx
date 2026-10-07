import Link from "next/link";
import type { RepoFile } from "@/lib/git";

function fileIcon(file: RepoFile) {
  if (file.type === "tree") {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4 text-sky-500" fill="currentColor">
        <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-zinc-400" fill="currentColor">
      <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" />
    </svg>
  );
}

function formatSize(bytes?: number) {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileTree({
  files,
  user,
  repo,
  basePath,
}: {
  files: RepoFile[];
  user: string;
  repo: string;
  basePath?: string;
}) {
  return (
    <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {files.map((file) => {
        const href =
          file.type === "tree"
            ? `/${user}/${repo}/tree/${file.path}`
            : `/${user}/${repo}/blob/${file.path}`;

        return (
          <Link
            key={file.path}
            href={href}
            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            {fileIcon(file)}
            <span className="flex-1 font-mono text-zinc-900 dark:text-zinc-100">
              {file.name}
            </span>
            {file.size !== undefined && (
              <span className="text-xs text-zinc-400">{formatSize(file.size)}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
