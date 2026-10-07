import { Fragment } from "react";
import type { DiffFile } from "@/lib/git";

function StatusBadge({ status }: { status: DiffFile["status"] }) {
  const config = {
    added: { bg: "bg-diff-add/15", text: "text-diff-add", label: "Added" },
    deleted: { bg: "bg-diff-del/15", text: "text-diff-del", label: "Deleted" },
    modified: { bg: "bg-warning/15", text: "text-warning", label: "Modified" },
    renamed: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Renamed" },
  }[status];

  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function DiffStat({ additions, deletions }: { additions: number; deletions: number }) {
  const total = additions + deletions;
  const blocks = 5;
  const addBlocks = total > 0 ? Math.round((additions / total) * blocks) : 0;
  const delBlocks = total > 0 ? blocks - addBlocks : 0;

  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px]">
      <span className="text-diff-add">+{additions}</span>
      <span className="text-diff-del">-{deletions}</span>
      <span className="flex gap-px">
        {Array.from({ length: addBlocks }, (_, i) => (
          <span key={`a${i}`} className="h-1.5 w-1.5 rounded-sm bg-diff-add" />
        ))}
        {Array.from({ length: delBlocks }, (_, i) => (
          <span key={`d${i}`} className="h-1.5 w-1.5 rounded-sm bg-diff-del" />
        ))}
      </span>
    </span>
  );
}

export default function DiffView({ files }: { files: DiffFile[] }) {
  if (files.length === 0) {
    return <p className="text-xs text-foreground-muted">No changes in this commit.</p>;
  }

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <div>
      <div className="mb-4 rounded-lg border border-border bg-surface p-3 text-xs text-foreground-light">
        Showing{" "}
        <span className="font-medium text-foreground">{files.length} changed files</span>{" "}
        with{" "}
        <span className="font-medium text-diff-add">{totalAdditions} additions</span>{" "}
        and{" "}
        <span className="font-medium text-diff-del">{totalDeletions} deletions</span>
      </div>

      <div className="space-y-3">
        {files.map((file, fileIdx) => (
          <div key={fileIdx} className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
              <StatusBadge status={file.status} />
              <span className="font-mono text-xs text-foreground-light">
                {file.status === "renamed"
                  ? `${file.oldPath} → ${file.newPath}`
                  : file.newPath || file.oldPath}
              </span>
              <span className="ml-auto">
                <DiffStat additions={file.additions} deletions={file.deletions} />
              </span>
            </div>

            <div className="overflow-x-auto bg-[#0d1117]">
              <table className="w-full border-collapse font-mono text-[11px]">
                <tbody>
                  {file.hunks.map((hunk, hunkIdx) => (
                    <Fragment key={`hunk-${hunkIdx}`}>
                      <tr className="bg-blue-500/8">
                        <td colSpan={3} className="px-4 py-0.5 text-blue-400/80">
                          {hunk.header}
                        </td>
                      </tr>
                      {hunk.lines.map((line, lineIdx) => {
                        const isAdd = line.type === "add";
                        const isDel = line.type === "delete";
                        const bgClass = isAdd
                          ? "bg-diff-add/8"
                          : isDel
                            ? "bg-diff-del/8"
                            : "";
                        const textClass = isAdd
                          ? "text-diff-add"
                          : isDel
                            ? "text-diff-del"
                            : "text-foreground-muted";
                        const gutterBg = isAdd
                          ? "bg-diff-add/15 text-diff-add/50"
                          : isDel
                            ? "bg-diff-del/15 text-diff-del/50"
                            : "text-foreground-muted/40";

                        return (
                          <tr key={`${hunkIdx}-${lineIdx}`} className={bgClass}>
                            <td className={`w-[1%] select-none whitespace-nowrap border-r border-border/30 px-2 py-0 text-right ${gutterBg}`}>
                              {line.oldNum ?? ""}
                            </td>
                            <td className={`w-[1%] select-none whitespace-nowrap border-r border-border/30 px-2 py-0 text-right ${gutterBg}`}>
                              {line.newNum ?? ""}
                            </td>
                            <td className={`whitespace-pre px-4 py-0 ${textClass}`}>
                              <span className="mr-2 select-none opacity-50">
                                {isAdd ? "+" : isDel ? "-" : " "}
                              </span>
                              {line.content}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
