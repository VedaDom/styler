import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as unknown as Adapter,
  session: { strategy: "database" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Try to use the user provided by NextAuth first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingId = (user as any)?.id as string | undefined;
        if (existingId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session.user as any).id = existingId;
          return session;
        }

        // Fallback: look up the user by email to attach the id for database strategy
        const email = session.user.email ?? undefined;
        if (email) {
          const dbUser = await db.user.findUnique({ where: { email }, select: { id: true } });
          if (dbUser?.id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (session.user as any).id = dbUser.id;
          }
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
