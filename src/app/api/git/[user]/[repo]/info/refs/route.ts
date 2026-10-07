import { NextRequest, NextResponse } from "next/server";
import { repoPath } from "@/lib/paths";
import { createInfoRefsResponse } from "@/lib/git-http";
import { repoExists } from "@/lib/git";

type Params = { user: string; repo: string };

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { user, repo: rawRepo } = await params;
  const repo = rawRepo.replace(/\.git$/, "");
  const service = req.nextUrl.searchParams.get("service");

  if (!service || !["git-upload-pack", "git-receive-pack"].includes(service)) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }

  const exists = await repoExists(user, repo);
  if (!exists) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const serviceName = service.replace("git-", "");
  const rp = repoPath(user, repo);

  try {
    const body = await createInfoRefsResponse(serviceName, rp);
    return new Response(body as unknown as BodyInit, {
      headers: {
        "Content-Type": `application/x-${service}-advertisement`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("info/refs error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
