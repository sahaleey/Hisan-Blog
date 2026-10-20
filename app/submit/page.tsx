import { SubmissionForm } from "@/components/submission-form";

export default function SubmitPage() {
  return (
    <div className="form-wrap">
      <div
        className="section-rule"
        style={{ borderTop: "none", paddingBottom: "1rem" }}
      >
        <span>03 / Contributions</span>
        <span>Student Writing Studio</span>
      </div>
      <h1 className="display page-title" style={{ margin: "0.5rem 0 1rem" }}>
        Leave something behind.
      </h1>
      <p
        className="muted"
        style={{ fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2.5rem" }}
      >
        LAFZOON accepts original poetry, essays, short fiction, translations,
        and scholarly commentary in English, Malayalam, Arabic, and Urdu. All
        submissions undergo editorial review before being catalogued in the
        permanent archive.
      </p>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-sm)",
          padding: "1.25rem 1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1.25rem",
          boxShadow: "var(--shadow-subtle)",
          marginBottom: "2rem",
        }}
      >
        <div>
          <span className="eyebrow" style={{ fontSize: "0.6rem" }}>
            Step 01
          </span>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Draft your piece
          </p>
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            Use our rich-text writing studio
          </span>
        </div>
        <div>
          <span className="eyebrow" style={{ fontSize: "0.6rem" }}>
            Step 02
          </span>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Editorial Review
          </p>
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            Private until editors approve
          </span>
        </div>
        <div>
          <span className="eyebrow" style={{ fontSize: "0.6rem" }}>
            Step 03
          </span>
          <p
            style={{
              margin: "0.2rem 0 0",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Permanent Issue
          </p>
          <span className="muted" style={{ fontSize: "0.75rem" }}>
            Published in the living archive
          </span>
        </div>
      </div>

      <SubmissionForm />
    </div>
  );
}
