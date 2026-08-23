import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
});
