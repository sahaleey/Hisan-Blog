import type { JSONContent } from "@tiptap/core";
import type React from "react";
import { isSafeHref } from "@/lib/rich-text";

export function RichTextContent({ document }: { document: JSONContent }) {
  return <div className="reading-rich-content">{renderNodes(document.content ?? [])}</div>;
}

function renderNodes(nodes: JSONContent[]): React.ReactNode {
  return nodes.map((node, index) => {
    const children = node.content ? renderNodes(node.content) : null;
    const align = typeof node.attrs?.textAlign === "string" ? node.attrs.textAlign : undefined;
    const style = align ? { textAlign: align as "left" | "center" | "right" | "justify" } : undefined;
    switch (node.type) {
      case "text":
        return <span key={index}>{applyMarks(node.text ?? "", node.marks)}</span>;
      case "heading": {
        const props = { key: index, style };
        if (node.attrs?.level === 1) return <h2 {...props}>{children}</h2>;
        if (node.attrs?.level === 2) return <h3 {...props}>{children}</h3>;
        return <h4 {...props}>{children}</h4>;
      }
      case "bulletList": return <ul key={index}>{children}</ul>;
      case "orderedList": return <ol key={index}>{children}</ol>;
      case "listItem": return <li key={index}>{children}</li>;
      case "blockquote": return <blockquote key={index} style={style}>{children}</blockquote>;
      case "hardBreak": return <br key={index} />;
      default: return <p key={index} style={style}>{children}</p>;
    }
  });
}

function applyMarks(text: string, marks: JSONContent["marks"]) {
  return marks?.reduce<React.ReactNode>((content, mark, index) => {
    if (mark.type === "link" && typeof mark.attrs?.href === "string" && isSafeHref(mark.attrs.href)) {
      return <a key={index} href={mark.attrs.href} rel="noopener noreferrer">{content}</a>;
    }
    if (mark.type === "bold") return <strong key={index}>{content}</strong>;
    if (mark.type === "italic") return <em key={index}>{content}</em>;
    if (mark.type === "underline") return <u key={index}>{content}</u>;
    if (mark.type === "strike") return <s key={index}>{content}</s>;
    return content;
  }, text);
}
