import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

const LANG_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  py: "python",
  rb: "ruby",
  rs: "rust",
  go: "go",
  java: "java",
  cs: "csharp",
  cpp: "cpp",
  c: "c",
  h: "c",
  hpp: "cpp",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  yml: "yaml",
  yaml: "yaml",
  json: "json",
  md: "markdown",
  mdx: "mdx",
  css: "css",
  scss: "css",
  html: "html",
  xml: "xml",
  svg: "xml",
  sql: "sql",
  graphql: "graphql",
  dockerfile: "dockerfile",
  toml: "toml",
  ini: "ini",
  tf: "hcl",
  vue: "vue",
  svelte: "svelte",
  swift: "swift",
  kt: "kotlin",
  php: "php",
  lua: "lua",
  zig: "zig",
};

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [
        "typescript", "tsx", "javascript", "jsx", "python", "rust", "go",
        "java", "csharp", "cpp", "c", "bash", "yaml", "json", "markdown",
        "css", "html", "xml", "sql", "ruby", "swift", "kotlin", "php",
        "lua", "toml", "ini", "hcl", "vue", "svelte", "dockerfile", "zig",
        "mdx", "graphql",
      ],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const lang = LANG_MAP[ext];

  if (!lang) {
    return escapeHtml(code);
  }

  try {
    const highlighter = await getHighlighter();
    return highlighter.codeToHtml(code, {
      lang,
      theme: "github-dark",
    });
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getLangFromFilename(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return LANG_MAP[ext] || null;
}
