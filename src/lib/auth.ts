import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { CrmRole } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.crmUser.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        await prisma.crmUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await prisma.crmActivityLog.create({
          data: { userId: user.id, action: "LOGIN" },
        });

        await prisma.crmSession.create({
          data: { userId: user.id },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          domainId: user.domainId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: CrmRole }).role;
        token.domainId = (user as { domainId: string | null }).domainId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as CrmRole;
        session.user.domainId = token.domainId as string | null;
      }
      return session;
    },
  },
});
