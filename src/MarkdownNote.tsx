import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";
import type { ReactNode } from "react";

// Titles live inside headings/buttons, so keep their markup phrasing-only and
// avoid nested links. Both modes share exactly the same Markdown/math pipeline.
const inlineText = ({ children }: { children?: ReactNode }) => (
  <span>{children}</span>
);
const inlineComponents: Components = {
  p: inlineText,
  div: inlineText,
  h1: inlineText,
  h2: inlineText,
  h3: inlineText,
  h4: inlineText,
  h5: inlineText,
  h6: inlineText,
  ul: inlineText,
  ol: inlineText,
  li: inlineText,
  blockquote: inlineText,
  pre: inlineText,
  a: inlineText,
  img: ({ alt }) => <span>{alt}</span>,
  hr: () => <span> </span>,
};

export function MarkdownNote({
  text,
  inline = false,
}: {
  text: string;
  inline?: boolean;
}) {
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={`markdown-note${inline ? " markdown-inline" : ""}`}>
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { trust: false }]]}
        components={inline ? inlineComponents : undefined}
      >
        {text}
      </ReactMarkdown>
    </Wrapper>
  );
}
