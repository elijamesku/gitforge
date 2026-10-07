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
