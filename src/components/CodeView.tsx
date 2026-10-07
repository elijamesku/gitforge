export default function CodeView({
  content,
  filename,
}: {
  content: string;
  filename: string;
}) {
  const lines = content.split("\n");
  const lineCount = lines.length;
  const gutterWidth = String(lineCount).length;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
          {filename}
        </span>
        <span className="text-xs text-zinc-400">{lineCount} lines</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                <td className="select-none border-r border-zinc-200 px-3 py-0 text-right font-mono text-xs text-zinc-400 dark:border-zinc-800"
                  style={{ width: `${gutterWidth + 2}ch` }}
                >
                  {i + 1}
                </td>
                <td className="whitespace-pre px-4 py-0 font-mono text-zinc-800 dark:text-zinc-200">
                  {line || "\n"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
