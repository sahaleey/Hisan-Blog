import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { ensureAuthorForGoogleAccount, getAuthorById } from "@/lib/authors";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google" || !account.providerAccountId || !user.email) {
        return false;
      }

      const author = await ensureAuthorForGoogleAccount({
        googleId: account.providerAccountId,
        email: user.email,
        displayName: profile?.name || user.name || user.email,
      });
      user.id = author.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.authorId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.authorId) {
        const author = await getAuthorById(token.authorId);
        if (author?.status === "active") {
          session.user.id = author.id;
          session.user.role = author.role;
        } else {
          // Keep the session usable for sign-out, but remove its authorization identity.
          session.user.id = "";
          session.user.role = "author";
        }
      }
      return session;
    },
  },
  pages: {
    error: "/",
  },
});
