import fs from "fs";
import path from "path";
import { dbPath } from "./paths";

export interface Repo {
  id: number;
  user: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
}

interface DbData {
  repos: Repo[];
  nextId: number;
}

function readDb(): DbData {
  const dp = dbPath();
  try {
    const raw = fs.readFileSync(dp, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { repos: [], nextId: 1 };
  }
}

function writeDb(data: DbData): void {
  const dp = dbPath();
  fs.mkdirSync(path.dirname(dp), { recursive: true });
  fs.writeFileSync(dp, JSON.stringify(data, null, 2));
}

export async function createRepo(
  user: string,
  name: string,
  description: string = "",
  visibility: string = "public"
): Promise<Repo> {
  const data = readDb();
  const now = new Date().toISOString();
  const repo: Repo = {
    id: data.nextId++,
    user,
    name,
    description,
    visibility: visibility as "public" | "private",
    created_at: now,
    updated_at: now,
  };
  data.repos.push(repo);
  writeDb(data);
  return repo;
}

export async function getRepo(user: string, name: string): Promise<Repo | undefined> {
  const data = readDb();
  return data.repos.find((r) => r.user === user && r.name === name);
}

export async function listRepos(user?: string): Promise<Repo[]> {
  const data = readDb();
  let repos = data.repos;
  if (user) {
    repos = repos.filter((r) => r.user === user);
  } else {
    repos = repos.filter((r) => r.visibility === "public");
  }
  return repos.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function deleteRepo(user: string, name: string): Promise<void> {
  const data = readDb();
  data.repos = data.repos.filter((r) => !(r.user === user && r.name === name));
  writeDb(data);
}
