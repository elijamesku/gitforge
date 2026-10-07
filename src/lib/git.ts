import { execFile, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { repoPath } from "./paths";

const exec = promisify(execFile);

export interface RepoFile {
  name: string;
  path: string;
  type: "blob" | "tree";
  mode: string;
  sha: string;
  size?: number;
}

export interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  email: string;
  date: string;
  relativeDate: string;
}

export async function initBareRepo(user: string, repo: string): Promise<string> {
  const rp = repoPath(user, repo);
  await fs.mkdir(path.dirname(rp), { recursive: true });
  await exec("git", ["init", "--bare", rp]);
  return rp;
}

export async function repoExists(user: string, repo: string): Promise<boolean> {
  try {
    await fs.access(path.join(repoPath(user, repo), "HEAD"));
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(
  user: string,
  repo: string,
  ref: string = "HEAD",
  dirPath: string = ""
): Promise<RepoFile[]> {
  const rp = repoPath(user, repo);
  const treeish = dirPath ? `${ref}:${dirPath}` : ref;

  try {
    const { stdout } = await exec("git", [
      "--git-dir", rp,
      "ls-tree", "-l", treeish,
    ]);

    return stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const match = line.match(
          /^(\d+)\s+(blob|tree)\s+([a-f0-9]+)\s+(-|\d+)\t(.+)$/
        );
        if (!match) return null;
        const [, mode, type, sha, size, name] = match;
        return {
          name,
          path: dirPath ? `${dirPath}/${name}` : name,
          type: type as "blob" | "tree",
          mode,
          sha,
          size: size === "-" ? undefined : parseInt(size, 10),
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a!.type !== b!.type) return a!.type === "tree" ? -1 : 1;
        return a!.name.localeCompare(b!.name);
      }) as RepoFile[];
  } catch {
    return [];
  }
}

export async function readFile(
  user: string,
  repo: string,
  filePath: string,
  ref: string = "HEAD"
): Promise<{ content: string; size: number } | null> {
  const rp = repoPath(user, repo);
  try {
    const { stdout } = await exec("git", [
      "--git-dir", rp,
      "show", `${ref}:${filePath}`,
    ], { maxBuffer: 10 * 1024 * 1024 });
    return { content: stdout, size: Buffer.byteLength(stdout) };
  } catch {
    return null;
  }
}

export async function listCommits(
  user: string,
  repo: string,
  ref: string = "HEAD",
  limit: number = 30
): Promise<Commit[]> {
  const rp = repoPath(user, repo);
  const sep = "---COMMIT---";
  const fmt = ["%H", "%h", "%s", "%an", "%ae", "%ci", "%cr"].join("%n");

  try {
    const { stdout } = await exec("git", [
      "--git-dir", rp,
      "log", `--format=${fmt}${sep}`, `-${limit}`, ref,
    ]);

    return stdout
      .split(sep)
      .filter((s) => s.trim())
      .map((block) => {
        const [sha, shortSha, message, author, email, date, relativeDate] =
          block.trim().split("\n");
        return { sha, shortSha, message, author, email, date, relativeDate };
      });
  } catch {
    return [];
  }
}

export async function getDefaultBranch(user: string, repo: string): Promise<string> {
  const rp = repoPath(user, repo);
  try {
    const { stdout } = await exec("git", [
      "--git-dir", rp,
      "symbolic-ref", "--short", "HEAD",
    ]);
    return stdout.trim() || "main";
  } catch {
    return "main";
  }
}

export async function listBranches(user: string, repo: string): Promise<string[]> {
  const rp = repoPath(user, repo);
  try {
    const { stdout } = await exec("git", [
      "--git-dir", rp,
      "branch", "--format=%(refname:short)",
    ]);
    return stdout.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export async function getCommitCount(user: string, repo: string, ref: string = "HEAD"): Promise<number> {
  const rp = repoPath(user, repo);
  try {
    const { stdout } = await exec("git", [
      "--git-dir", rp,
      "rev-list", "--count", ref,
    ]);
    return parseInt(stdout.trim(), 10);
  } catch {
    return 0;
  }
}

export function spawnGitProcess(
  command: string,
  repoDir: string,
  args: string[] = []
): ReturnType<typeof spawn> {
  return spawn("git", [command, "--stateless-rpc", ...args, repoDir]);
}

export function advertiseRefs(
  command: string,
  repoDir: string
): ReturnType<typeof spawn> {
  return spawn("git", [command, "--stateless-rpc", "--advertise-refs", repoDir]);
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  status: "added" | "deleted" | "modified" | "renamed";
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "add" | "delete" | "context";
  content: string;
  oldNum?: number;
  newNum?: number;
}

export async function getCommitDiff(
  user: string,
  repo: string,
  sha: string
): Promise<DiffFile[]> {
  const rp = repoPath(user, repo);
  try {
    const { stdout } = await exec("git", [
      "--git-dir", rp,
      "diff-tree", "-p", "--no-commit-id", "--root", "-M", sha,
    ], { maxBuffer: 10 * 1024 * 1024 });
    return parseDiff(stdout);
  } catch {
    return [];
  }
}

export async function getCommit(
  user: string,
  repo: string,
  sha: string
): Promise<Commit | null> {
  const rp = repoPath(user, repo);
  try {
    const { stdout } = await exec("git", [
      "--git-dir", rp,
      "log", "-1", `--format=%H%n%h%n%s%n%an%n%ae%n%ci%n%cr`, sha,
    ]);
    const [fullSha, shortSha, message, author, email, date, relativeDate] =
      stdout.trim().split("\n");
    return { sha: fullSha, shortSha, message, author, email, date, relativeDate };
  } catch {
    return null;
  }
}

export async function getDiffStats(
  user: string,
  repo: string,
  sha: string
): Promise<{ files: number; additions: number; deletions: number }> {
  const rp = repoPath(user, repo);
  try {
    const { stdout } = await exec("git", [
      "--git-dir", rp,
      "diff-tree", "--no-commit-id", "--root", "--shortstat", sha,
    ]);
    const filesMatch = stdout.match(/(\d+) files? changed/);
    const addMatch = stdout.match(/(\d+) insertions?\(\+\)/);
    const delMatch = stdout.match(/(\d+) deletions?\(-\)/);
    return {
      files: filesMatch ? parseInt(filesMatch[1]) : 0,
      additions: addMatch ? parseInt(addMatch[1]) : 0,
      deletions: delMatch ? parseInt(delMatch[1]) : 0,
    };
  } catch {
    return { files: 0, additions: 0, deletions: 0 };
  }
}

export async function getContributionData(
  user: string
): Promise<{ date: string; count: number }[]> {
  const rp = path.join(process.cwd(), "data", "repos", user);
  try {
    await fs.access(rp);
  } catch {
    return [];
  }

  const countMap = new Map<string, number>();

  try {
    const entries = await fs.readdir(rp);
    for (const entry of entries) {
      if (!entry.endsWith(".git")) continue;
      const gitDir = path.join(rp, entry);
      try {
        const { stdout } = await exec("git", [
          "--git-dir", gitDir,
          "log", "--all", "--format=%ci",
        ]);
        for (const line of stdout.trim().split("\n")) {
          if (!line) continue;
          const date = line.split(" ")[0];
          countMap.set(date, (countMap.get(date) || 0) + 1);
        }
      } catch {
        continue;
      }
    }
  } catch {
    return [];
  }

  return Array.from(countMap, ([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function parseDiff(raw: string): DiffFile[] {
  const files: DiffFile[] = [];
  const fileParts = raw.split(/^diff --git /m).filter(Boolean);

  for (const part of fileParts) {
    const lines = part.split("\n");
    const headerLine = lines[0];
    const aMatch = headerLine.match(/a\/(.+?) b\/(.+)/);
    const oldPath = aMatch?.[1] || "";
    const newPath = aMatch?.[2] || "";

    let status: DiffFile["status"] = "modified";
    if (part.includes("new file mode")) status = "added";
    else if (part.includes("deleted file mode")) status = "deleted";
    else if (part.includes("rename from")) status = "renamed";

    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let oldLine = 0;
    let newLine = 0;
    let additions = 0;
    let deletions = 0;

    for (const line of lines) {
      if (line.startsWith("@@")) {
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/);
        if (match) {
          oldLine = parseInt(match[1]);
          newLine = parseInt(match[2]);
          currentHunk = { header: line, lines: [] };
          hunks.push(currentHunk);
        }
      } else if (currentHunk) {
        if (line.startsWith("+")) {
          additions++;
          currentHunk.lines.push({
            type: "add",
            content: line.slice(1),
            newNum: newLine++,
          });
        } else if (line.startsWith("-")) {
          deletions++;
          currentHunk.lines.push({
            type: "delete",
            content: line.slice(1),
            oldNum: oldLine++,
          });
        } else if (line.startsWith(" ") || line === "") {
          currentHunk.lines.push({
            type: "context",
            content: line.slice(1),
            oldNum: oldLine++,
            newNum: newLine++,
          });
        }
      }
    }

    files.push({ oldPath, newPath, status, hunks, additions, deletions });
  }

  return files;
}
