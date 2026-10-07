import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export function repoPath(user: string, repo: string): string {
  return path.join(DATA_DIR, "repos", user, `${repo}.git`);
}

export function dbPath(): string {
  return path.join(DATA_DIR, "forge.json");
}
