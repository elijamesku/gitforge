import { spawn } from "child_process";

function pktLine(line: string): string {
  const len = (line.length + 4).toString(16).padStart(4, "0");
  return `${len}${line}`;
}

export function createInfoRefsResponse(service: string, repoDir: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const proc = spawn("git", [service, "--stateless-rpc", "--advertise-refs", repoDir]);
    const chunks: Buffer[] = [];

    proc.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    proc.stderr.on("data", (chunk: Buffer) => {
      console.error("git stderr:", chunk.toString());
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`git ${service} exited with code ${code}`));
        return;
      }
      const header = Buffer.from(pktLine(`# service=git-${service}\n`) + "0000");
      const body = Buffer.concat(chunks);
      resolve(new Uint8Array(Buffer.concat([header, body])));
    });

    proc.on("error", reject);
  });
}

export function createServiceResponse(
  service: string,
  repoDir: string,
  body: ReadableStream<Uint8Array> | null
): ReadableStream<Uint8Array> {
  const proc = spawn("git", [service, "--stateless-rpc", repoDir]);

  if (body) {
    const reader = body.getReader();
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          proc.stdin.write(value);
        }
        proc.stdin.end();
      } catch {
        proc.stdin.end();
      }
    })();
  } else {
    proc.stdin.end();
  }

  return new ReadableStream({
    start(controller) {
      proc.stdout.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      proc.stderr.on("data", (chunk: Buffer) => {
        console.error("git stderr:", chunk.toString());
      });
      proc.on("close", () => {
        controller.close();
      });
      proc.on("error", (err) => {
        controller.error(err);
      });
    },
  });
}
