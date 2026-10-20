import type { JSONContent } from "@tiptap/core";

const allowedMarks = new Set(["bold", "italic", "underline", "strike", "link"]);
const allowedNodes = new Set([
  "doc",
  "paragraph",
  "heading",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
]);
const allowedAlignments = new Set(["left", "center", "right", "justify"]);

export function isRichTextDocument(value: unknown): value is JSONContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const document = value as JSONContent;
  return (
    document.type === "doc" &&
    Array.isArray(document.content) &&
    document.content.every(isRichTextNode)
  );
}

function isRichTextNode(value: unknown): value is JSONContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const node = value as JSONContent;
  if (!node.type || !allowedNodes.has(node.type)) return false;
  if (node.type === "text" && typeof node.text !== "string") return false;
  if (
    node.type === "heading" &&
    (!Number.isInteger(node.attrs?.level) ||
      ![1, 2, 3].includes(node.attrs?.level as number))
  )
    return false;
  if (
    node.attrs?.textAlign != null &&
    (typeof node.attrs.textAlign !== "string" ||
      !allowedAlignments.has(node.attrs.textAlign))
  ) {
    return false;
  }
  if (node.attrs?.level !== undefined && node.type !== "heading") return false;
  if (
    node.marks &&
    (!Array.isArray(node.marks) ||
      !node.marks.every((mark) =>
        Boolean(
          mark && typeof mark.type === "string" && allowedMarks.has(mark.type),
        ),
      ))
  )
    return false;
  if (
    node.marks?.some(
      (mark) =>
        mark.type === "link" &&
        (typeof mark.attrs?.href !== "string" || !isSafeHref(mark.attrs.href)),
    )
  )
    return false;
  return (
    node.content === undefined ||
    (Array.isArray(node.content) && node.content.every(isRichTextNode))
  );
}

export function isSafeHref(href: string) {
  return (
    /^(https?:\/\/|mailto:|\/|#)/i.test(href) &&
    !/[\u0000-\u001f\u007f]/.test(href) &&
    !href.startsWith("//")
  );
}

export function plainTextFromDocument(document: JSONContent) {
  const chunks: string[] = [];
  function visit(node: JSONContent) {
    if (node.type === "text") chunks.push(node.text ?? "");
    else if (
      node.type === "hardBreak" ||
      node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "blockquote"
    )
      chunks.push("\n");
    node.content?.forEach(visit);
    if (
      node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "listItem"
    )
      chunks.push("\n");
  }
  visit(document);
  return chunks
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
