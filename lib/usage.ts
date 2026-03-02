import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function enforceUsageLimit(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const sameDay = user.lastUsageDate && user.lastUsageDate.toDateString() === now.toDateString();
  const usageCount = sameDay ? user.freeUsageCount : 0;

  if (user.role === Role.FREE && usageCount >= 3) {
    return { allowed: false, reason: "Free plan daily limit reached" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      freeUsageCount: sameDay ? { increment: 1 } : 1,
      lastUsageDate: now,
    },
  });

  return { allowed: true };
}
