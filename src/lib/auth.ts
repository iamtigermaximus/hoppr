import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.username, image: user.avatarUrl };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        session.user.image = (token as any).picture as string | null | undefined;
        session.user.name = (token as any).name as string | null | undefined;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, store user info in token
      if (user) {
        token.sub = user.id;
        (token as any).picture = user.image;
        (token as any).name = user.name;
      }

      // On session update (e.g., profile change), refresh from DB
      if (trigger === "update" && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { username: true, avatarUrl: true },
        });
        if (dbUser) {
          (token as any).picture = dbUser.avatarUrl;
          (token as any).name = dbUser.username;
        }
        // Also apply any session data passed to update()
        if (session?.image !== undefined) {
          (token as any).picture = session.image;
        }
        if (session?.name !== undefined) {
          (token as any).name = session.name;
        }
      }

      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
};
