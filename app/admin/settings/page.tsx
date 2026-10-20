export default function AdminSettingsPage() {
  return (
    <>
      <div className="section-rule" style={{ borderTop: "none", paddingBottom: "1rem" }}>
        <span>06 / System Configuration</span>
        <span>Platform Boundaries</span>
      </div>
      <h2 className="display admin-title">Security & architectural boundaries.</h2>

      <div className="admin-panel" style={{ display: "grid", gap: "1.25rem", maxWidth: "800px" }}>
        <div>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", margin: "0 0 0.5rem" }}>
            Server-Side Credentials
          </h3>
          <p className="muted" style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
            All administrative credentials, OAuth client secrets, PostgreSQL credentials, and Cloudflare R2
            object storage configurations are strictly enforced via server-side environment variables and are never
            transmitted to or exposed in client dashboards.
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.3rem", margin: "0 0 0.5rem" }}>
            Role Escalation & Bootstrapping
          </h3>
          <p className="muted" style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>
            Initial administrator privileges are created through the cryptographically verified bootstrap script
            (<code style={{ fontFamily: "var(--font-mono)", fontSize: "0.85em", background: "var(--color-surface-muted)", padding: "0.15rem 0.35rem", borderRadius: "2px" }}>node scripts/bootstrap-admin.mjs</code>).
            Subsequent role assignments and verifications are managed through the Writers directory with complete audit logging.
          </p>
        </div>
      </div>
    </>
  );
}
