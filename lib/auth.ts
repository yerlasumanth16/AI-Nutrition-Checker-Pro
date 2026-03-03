import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { env } from "./env";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub;
        
        try {
          // Fetch latest user data from DB
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { planType: true, usageCount: true },
          });

          if (dbUser) {
            (session.user as any).planType = dbUser.planType;
            (session.user as any).usageCount = dbUser.usageCount;
          }
        } catch (error) {
          console.error("Error fetching user data in session callback:", error);
          // Don't crash the session if DB fails, just return basic session
        }
      }
      return session;
    },
  },
};
