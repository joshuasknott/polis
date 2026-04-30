import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    ...(process.env.GITHUB_ID ? [
      GitHub({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
    ] : []),
    ...(process.env.GOOGLE_ID ? [
      Google({
        clientId: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
      }),
    ] : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      if (account?.provider === "github" || account?.provider === "google") {
        if (!user.email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        const accountData = {
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token ?? null,
          refresh_token: account.refresh_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: typeof account.scope === "string" ? account.scope : null,
          id_token: typeof account.id_token === "string" ? account.id_token : null,
          session_state: typeof account.session_state === "string" ? account.session_state : null,
        };

        if (existingUser) {
          const hasAccount = existingUser.accounts.some(
            (a) => a.provider === account.provider && a.providerAccountId === account.providerAccountId
          );

          if (!hasAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                ...accountData,
              },
            });
          }

          return true;
        }

        await prisma.user.create({
          data: {
            name: user.name || "New Student",
            email: user.email,
            image: user.image,
            accounts: {
              create: accountData,
            },
          },
        });

        return true;
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
