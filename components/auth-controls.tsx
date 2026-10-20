import Link from "next/link";
import { sql } from "@vercel/postgres";
import { auth, signIn, signOut } from "@/auth";
import { AccountMenu } from "@/components/account-menu";
import { GoogleMark } from "@/components/google-mark";

export async function AuthControls() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <form action={async () => { "use server"; await signIn("google", { redirectTo: "/workspace" }); }}>
        <button className="header-action header-button google-sign-in" type="submit"><GoogleMark /> <span>Sign in</span></button>
      </form>
    );
  }

  const unread = await sql<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM notifications
    WHERE recipient_id = ${session.user.id} AND read_at IS NULL
  `;
  return (
    <div className="auth-controls">
      <Link className="notification-button" href="/notifications" aria-label={`Notifications${unread.rows[0]?.count ? `, ${unread.rows[0].count} unread` : ""}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="notification-icon">
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unread.rows[0]?.count ? <span className="notification-count">{unread.rows[0].count > 99 ? "99+" : unread.rows[0].count}</span> : null}
      </Link>
      <AccountMenu label={session.user.name ?? "Account"}>
        <Link className="account-menu-item" href="/workspace" role="menuitem">Workspace</Link>
        {session.user.role === "admin" ? <Link className="account-menu-item" href="/admin" role="menuitem">Admin dashboard</Link> : null}
        {session.user.role === "editor" ? <Link className="account-menu-item" href="/editor" role="menuitem">Editor workspace</Link> : null}
        {session.user.role === "moderator" || session.user.role === "admin" ? <Link className="account-menu-item" href="/moderation" role="menuitem">Moderation</Link> : null}
        <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
          <button className="account-menu-item account-menu-button" type="submit">Sign out</button>
        </form>
      </AccountMenu>
    </div>
  );
}
