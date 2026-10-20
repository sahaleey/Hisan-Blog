"use client";

import { useActionState, useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import Image from "next/image";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { submitWork } from "@/lib/submissions";
import { initialSubmissionState } from "@/lib/submission-state";
import { MAX_IMAGE_BYTES, validateImageBytes } from "@/lib/image-validation";

const languages = ["English", "Malayalam", "Arabic", "Urdu"];

export function SubmissionForm() {
  const [state, formAction, pending] = useActionState(
    submitWork,
    initialSubmissionState,
  );
  const [contentJson, setContentJson] = useState("");
  const [link, setLink] = useState("");
  const [imageError, setImageError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageValid, setImageValid] = useState(true);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
      }),
      TextAlign.configure({ types: ["heading", "paragraph", "blockquote"] }),
    ],
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) =>
      setContentJson(JSON.stringify(currentEditor.getJSON())),
  });

  useEffect(() => {
    if (editor && !contentJson)
      setContentJson(JSON.stringify(editor.getJSON()));
  }, [editor, contentJson]);

  const wordCount =
    editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0;

  function setHeading(level: 1 | 2 | 3) {
    editor?.chain().focus().toggleHeading({ level }).run();
  }

  function addLink() {
    if (!editor) return;
    if (!link.trim()) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: link.trim() }).run();
    setLink("");
  }

  async function validateSelectedImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImageError("");
    setImagePreview("");
    setImageValid(true);
    if (!file) return;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      validateImageBytes(bytes, file.name, file.type);
      setImagePreview(URL.createObjectURL(file));
    } catch (error) {
      setImageValid(false);
      setImageError(
        error instanceof Error
          ? error.message
          : "The selected image is invalid.",
      );
    }
  }

  return (
    <form action={formAction} style={{ marginTop: "2.5rem" }}>
      <div className="form-field">
        <label htmlFor="title">Title of Work</label>
        <input
          id="title"
          name="title"
          required
          maxLength={180}
          placeholder="Give your piece a thoughtful title"
          aria-invalid={Boolean(state.fieldErrors?.title)}
        />
        {state.fieldErrors?.title ? (
          <p className="form-error" role="alert">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.25rem" }}>
        <div className="form-field">
          <label htmlFor="genre">Genre or Form</label>
          <input
            id="genre"
            name="genre"
            required
            maxLength={80}
            placeholder="Poetry, Essay, Short Story, Critique…"
            aria-invalid={Boolean(state.fieldErrors?.genre)}
          />
          {state.fieldErrors?.genre ? (
            <p className="form-error" role="alert">{state.fieldErrors.genre}</p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="language">Language of Composition</label>
          <select
            id="language"
            name="language"
            defaultValue="English"
            aria-invalid={Boolean(state.fieldErrors?.language)}
          >
            {languages.map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="excerpt">
          Brief Excerpt or Opening Thesis <span className="muted" style={{ textTransform: "none", fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          maxLength={500}
          rows={3}
          dir="auto"
          placeholder="A short teaser or introductory thought that frames your work for the reader index…"
        />
      </div>

      <div className="form-field">
        <label htmlFor="cover_image">
          Featured Header Artwork <span className="muted" style={{ textTransform: "none", fontWeight: 400 }}>(optional, JPG/PNG up to {MAX_IMAGE_BYTES / 1024 / 1024} MiB)</span>
        </label>
        <input
          id="cover_image"
          name="cover_image"
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={validateSelectedImage}
          aria-describedby="cover-image-error"
          aria-invalid={Boolean(imageError)}
        />
        {imagePreview ? (
          <div style={{ marginTop: "1rem" }}>
            <Image
              className="cover-image-preview"
              src={imagePreview}
              alt="Selected cover preview"
              width={640}
              height={360}
              unoptimized
            />
          </div>
        ) : null}
        {imageError ? (
          <p id="cover-image-error" className="form-error" role="alert">
            {imageError}
          </p>
        ) : null}
        <div style={{ marginTop: "0.75rem" }}>
          <input
            id="image_alt"
            name="image_alt"
            maxLength={240}
            placeholder="Describe the image for accessibility and screen readers"
            aria-label="Cover image alternative text"
          />
        </div>
      </div>

      <div className="form-field">
        <label id="content-label">Manuscript & Content</label>
        <div className="editor-shell">
          <div
            className="editor-toolbar"
            role="toolbar"
            aria-label="Formatting tools"
          >
            <button
              type="button"
              aria-label="Paragraph"
              className={editor?.isActive("paragraph") ? "is-active" : ""}
              onClick={() => editor?.chain().focus().setParagraph().run()}
            >
              P
            </button>
            {[1, 2, 3].map((level) => (
              <button
                type="button"
                key={level}
                aria-label={`Heading ${level}`}
                className={
                  editor?.isActive("heading", { level }) ? "is-active" : ""
                }
                onClick={() => setHeading(level as 1 | 2 | 3)}
              >
                H{level}
              </button>
            ))}

            <span style={{ width: "1px", height: "18px", background: "var(--color-border)", margin: "0 4px" }} />

            <button
              type="button"
              aria-label="Bold"
              className={editor?.isActive("bold") ? "is-active" : ""}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              aria-label="Italic"
              className={editor?.isActive("italic") ? "is-active" : ""}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              aria-label="Underline"
              className={editor?.isActive("underline") ? "is-active" : ""}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <u>U</u>
            </button>
            <button
              type="button"
              aria-label="Strikethrough"
              className={editor?.isActive("strike") ? "is-active" : ""}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
            >
              <s>S</s>
            </button>

            <span style={{ width: "1px", height: "18px", background: "var(--color-border)", margin: "0 4px" }} />

            <button
              type="button"
              aria-label="Bulleted list"
              className={editor?.isActive("bulletList") ? "is-active" : ""}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              • List
            </button>
            <button
              type="button"
              aria-label="Numbered list"
              className={editor?.isActive("orderedList") ? "is-active" : ""}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              1. List
            </button>
            <button
              type="button"
              aria-label="Blockquote"
              className={editor?.isActive("blockquote") ? "is-active" : ""}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            >
              “ Quote
            </button>

            <span style={{ width: "1px", height: "18px", background: "var(--color-border)", margin: "0 4px" }} />

            {(["left", "center", "right", "justify"] as const).map(
              (alignment) => (
                <button
                  type="button"
                  key={alignment}
                  aria-label={`Align ${alignment}`}
                  className={
                    editor?.isActive({ textAlign: alignment })
                      ? "is-active"
                      : ""
                  }
                  onClick={() =>
                    editor?.chain().focus().setTextAlign(alignment).run()
                  }
                >
                  {alignment === "left"
                    ? "≡ Left"
                    : alignment === "center"
                      ? "≡ Center"
                      : alignment === "right"
                        ? "≡ Right"
                        : "≣ Justify"}
                </button>
              ),
            )}

            <span style={{ width: "1px", height: "18px", background: "var(--color-border)", margin: "0 4px" }} />

            <button
              type="button"
              aria-label="Undo"
              onClick={() => editor?.chain().focus().undo().run()}
            >
              ↶
            </button>
            <button
              type="button"
              aria-label="Redo"
              onClick={() => editor?.chain().focus().redo().run()}
            >
              ↷
            </button>
            <button
              type="button"
              aria-label="Clear formatting"
              onClick={() =>
                editor?.chain().focus().clearNodes().unsetAllMarks().run()
              }
            >
              Clear
            </button>
          </div>
          <div className="editor-link-row">
            <input
              aria-label="Link URL"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="Paste or type URL (https://…)"
            />
            <button type="button" className="text-link" onClick={addLink}>
              {editor?.isActive("link") ? "Remove link" : "Attach link"}
            </button>
          </div>
          <EditorContent editor={editor} aria-labelledby="content-label" />
          <div className="editor-count">
            <span>{wordCount} words</span>
          </div>
        </div>
        <input type="hidden" name="content" value={editor?.getText() ?? ""} />
        <input type="hidden" name="content_json" value={contentJson} />
        {state.fieldErrors?.content ? (
          <p className="form-error" role="alert">{state.fieldErrors.content}</p>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "2rem" }}>
        <button
          className="button"
          type="submit"
          disabled={pending || !imageValid}
        >
          {pending ? "Submitting for review…" : "Submit for Editorial Review ↗"}
        </button>
        <span className="muted" style={{ fontSize: "0.8rem" }}>
          Private until approved by an editor
        </span>
      </div>

      {state.message ? (
        <p
          className={state.status === "error" ? "form-error" : "form-success"}
          role="status"
          style={{ marginTop: "1.25rem", fontSize: "0.95rem" }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
