import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export function MarkdownNote({ text }: { text: string }) {
  return (
    <div className="markdown-note">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { trust: false }]]}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
