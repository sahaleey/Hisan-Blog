"use client";

import { useState } from "react";
import {
  addComment,
  deleteComment,
  toggleLike,
  toggleFollow,
} from "@/lib/community-actions";
import type { PublicComment } from "@/lib/reader";

export function WorkInteractions({
  workId,
  authorId,
  currentAuthorId,
  initialLikeCount,
  initialLiked,
  initialFollowing,
  comments,
}: {
  workId: string;
  authorId: string;
  currentAuthorId?: string;
  initialLikeCount: number;
  initialLiked: boolean;
  initialFollowing: boolean;
  comments: PublicComment[];
}) {
  const [likes, setLikes] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<PublicComment[]>(comments);

  async function like() {
    if (pending) return;
    setPending(true);
    try {
      const result = await toggleLike(workId);
      if (result.ok) {
        setLiked(Boolean(result.liked));
        setLikes((count) => count + (result.liked ? 1 : -1));
        setMessage("");
      } else {
        setMessage(result.message ?? "Sign in to like this work.");
      }
    } catch {
      setMessage("Unable to update your like. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function follow() {
    if (pending) return;
    setPending(true);
    try {
      const result = await toggleFollow(authorId);
      if (result.ok) {
        setFollowing(Boolean(result.following));
        setMessage(
          result.following
            ? "You are now following this writer."
            : "Writer unfollowed.",
        );
      } else {
        setMessage(result.message ?? "Sign in to follow writers.");
      }
    } catch {
      setMessage("Unable to update your follow. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !comment.trim()) return;
    setPending(true);
    try {
      const result = await addComment(workId, comment);
      if (result.ok) {
        setComment("");
        if (result.comment) setItems((current) => [...current, result.comment]);
        setMessage("Comment posted.");
      } else {
        setMessage(result.message ?? "Unable to add comment.");
      }
    } catch {
      setMessage("Unable to add your response. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="reading-community" aria-label="Reader interactions">
      <div className="interaction-actions">
        <button
          className={`button ${liked ? "" : "button-secondary"}`}
          type="button"
          disabled={pending}
          onClick={() => void like()}
          aria-label={liked ? "Unlike work" : "Like work"}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{liked ? "Liked" : "Like"}</span>
          <span>·</span>
          <span>{likes}</span>
        </button>

        {currentAuthorId !== authorId ? (
          <button
            className={`button ${following ? "button-secondary" : ""}`}
            type="button"
            disabled={pending}
            onClick={() => void follow()}
          >
            <span>{following ? "✓ Following writer" : "+ Follow writer"}</span>
          </button>
        ) : null}
      </div>

      <div className="section-rule" style={{ marginTop: "2rem" }}>
        <span>Responses & Discourse</span>
        <span>
          {items.length} {items.length === 1 ? "thought" : "thoughts"}
        </span>
      </div>

      <h2 className="display">Conversation</h2>

      {items.length === 0 ? (
        <p
          className="muted"
          style={{ fontStyle: "italic", margin: "1.5rem 0" }}
        >
          No responses have been recorded yet. Be the first reader to leave a
          thoughtful reflection.
        </p>
      ) : (
        <div style={{ margin: "1.5rem 0 3rem" }}>
          {items.map((item) => (
            <article className="comment" key={item.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.4rem",
                }}
              >
                <strong
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  {item.display_name}
                  {item.verified ? (
                    <span
                      className="verified-badge"
                      title="Verified LAFZOON writer"
                      aria-label="Verified LAFZOON writer"
                    >
                      ✓
                    </span>
                  ) : null}
                </strong>
                {item.author_id === currentAuthorId ? (
                  <button
                    className="text-link"
                    type="button"
                    onClick={async () => {
                      if (pending) return;
                      setPending(true);
                      try {
                        const result = await deleteComment(item.id);
                        if (result.ok) setItems((current) => current.filter((c) => c.id !== item.id));
                        else setMessage("Unable to delete response.");
                      } catch {
                        setMessage("Unable to delete response. Please try again.");
                      } finally {
                        setPending(false);
                      }
                    }}
                    disabled={pending}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      )}

      <form onSubmit={submitComment} style={{ marginTop: "2.5rem" }}>
        <label
          htmlFor="comment-input"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-text)",
            marginBottom: "0.5rem",
            display: "block",
          }}
        >
          Add to the conversation
        </label>
        <textarea
          id="comment-input"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={2000}
          placeholder="Reflect on this piece, share your perspective or constructive critique…"
          aria-label="Write your comment"
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "0.5rem",
          }}
        >
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            {comment.length} / 2000 characters
          </span>
          <button
            className="button"
            type="submit"
            disabled={pending || !comment.trim()}
          >
            {pending ? "Publishing…" : "Post response ↗"}
          </button>
        </div>
      </form>

      {message ? (
        <p
          className="muted"
          role="status"
          style={{ marginTop: "1rem", fontSize: "0.85rem" }}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
