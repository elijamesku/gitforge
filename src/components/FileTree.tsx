import Link from "next/link";
import { Folder, File } from "lucide-react";
import type { RepoFile } from "@/lib/git";

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
}: {
  files: RepoFile[];
  user: string;
  repo: string;
  basePath?: string;
}) {
  return (
    <div className="divide-y divide-border rounded-b-lg border border-t-0 border-border bg-surface">
      {files.map((file) => {
        const href =
          file.type === "tree"
            ? `/${user}/${repo}/tree/${file.path}`
            : `/${user}/${repo}/blob/${file.path}`;

        return (
          <Link
            key={file.path}
            href={href}
            className="flex items-center gap-2.5 px-4 py-1.5 text-xs transition-colors hover:bg-surface-100"
          >
            {file.type === "tree" ? (
              <Folder size={14} className="shrink-0 text-brand" />
            ) : (
              <File size={14} className="shrink-0 text-foreground-muted" />
            )}
            <span className="flex-1 font-mono text-foreground-light">
              {file.name}
            </span>
            {file.size !== undefined && (
              <span className="text-[10px] font-mono text-foreground-muted">{formatSize(file.size)}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
