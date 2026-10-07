import { NextRequest, NextResponse } from "next/server";
import { repoPath } from "@/lib/paths";
import { createServiceResponse } from "@/lib/git-http";
import { repoExists } from "@/lib/git";

type Params = { user: string; repo: string };

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { user, repo: rawRepo } = await params;
  const repo = rawRepo.replace(/\.git$/, "");

  if (!(await repoExists(user, repo))) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const rp = repoPath(user, repo);
  const stream = createServiceResponse("receive-pack", rp, req.body);

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-git-receive-pack-result",
      "Cache-Control": "no-cache",
    },
  });
}
