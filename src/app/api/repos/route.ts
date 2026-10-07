import { NextRequest, NextResponse } from "next/server";
import { createRepo, listRepos, getRepo } from "@/lib/db";
import { initBareRepo } from "@/lib/git";

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  const repos = await listRepos(user || undefined);
  return NextResponse.json(repos);
}

export async function POST(req: NextRequest) {
  const { user, name, description, visibility } = await req.json();

  if (!user || !name) {
    return NextResponse.json({ error: "user and name required" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
    return NextResponse.json({ error: "Invalid repo name" }, { status: 400 });
  }

  const existing = await getRepo(user, name);
  if (existing) {
    return NextResponse.json({ error: "Repository already exists" }, { status: 409 });
  }

  await initBareRepo(user, name);
  const repo = await createRepo(user, name, description || "", visibility || "public");

  return NextResponse.json(repo, { status: 201 });
}
