import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose-forge">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
