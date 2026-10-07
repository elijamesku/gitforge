import { highlightCode } from "@/lib/highlight";

export default async function CodeView({
  content,
  filename,
}: {
  content: string;
  filename: string;
}) {
  const highlighted = await highlightCode(content, filename);
  const lines = content.split("\n");
  const lineCount = lines.length;
  const gutterWidth = String(lineCount).length;
  const isHighlighted = highlighted.includes("<pre");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-xs text-foreground-lighter">{filename}</span>
        <span className="text-[10px] font-mono text-foreground-muted">{lineCount} lines</span>
      </div>
      {isHighlighted ? (
        <div className="shiki-wrapper overflow-x-auto">
          <style>{`
            .shiki-wrapper pre { margin: 0; padding: 0; background: transparent !important; }
            .shiki-wrapper code { counter-reset: line; display: block; }
            .shiki-wrapper code > span { display: block; padding: 0 1rem 0 0; line-height: 1.5; }
            .shiki-wrapper code > span::before {
              counter-increment: line;
              content: counter(line);
              display: inline-block;
              width: ${gutterWidth + 2}ch;
              padding-right: 1rem;
              text-align: right;
              color: hsl(var(--foreground-muted));
              border-right: 1px solid hsl(var(--border-default));
              margin-right: 1rem;
              user-select: none;
            }
            .shiki-wrapper code > span:hover { background: rgba(110, 118, 129, 0.08); }
          `}</style>
          <div dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-surface-200/30">
                  <td
                    className="select-none border-r border-border px-3 py-0 text-right font-mono text-foreground-muted"
                    style={{ width: `${gutterWidth + 2}ch` }}
                  >
                    {i + 1}
                  </td>
                  <td className="whitespace-pre px-4 py-0 font-mono text-foreground-light leading-relaxed">
                    {line || "\n"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
