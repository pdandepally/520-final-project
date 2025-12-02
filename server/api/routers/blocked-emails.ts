/**
 * tRPC Router for managing blocked emails (users under 18)
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { blockedEmailsTable } from "@/server/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { db } from "@/server/db";

export const blockedEmailsRouter = createTRPCRouter({
  /**
   * Check if an email is blocked
   */
  checkEmailBlocked: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const blocked = await db.query.blockedEmailsTable.findFirst({
        where: and(
          eq(blockedEmailsTable.email, input.email.toLowerCase()),
          gte(
            blockedEmailsTable.canRegisterAt,
            today.toISOString().split("T")[0],
          ),
        ),
      });

      return {
        isBlocked: !!blocked,
        canRegisterAt: blocked?.canRegisterAt,
      };
    }),

  /**
   * Add an email to the blocked list
   */
  blockEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        birthdate: z.string(), // Format: YYYY-MM-DD
      }),
    )
    .mutation(async ({ input }) => {
      const birthDate = new Date(input.birthdate);
      const canRegisterDate = new Date(birthDate);
      canRegisterDate.setFullYear(birthDate.getFullYear() + 18);

      // Check if already blocked
      const existing = await db.query.blockedEmailsTable.findFirst({
        where: eq(blockedEmailsTable.email, input.email.toLowerCase()),
      });

      if (existing) {
        // Email already blocked, no need to add again
        return { success: true, alreadyBlocked: true };
      }

      await db.insert(blockedEmailsTable).values({
        email: input.email.toLowerCase(),
        birthdate: input.birthdate,
        canRegisterAt: canRegisterDate.toISOString().split("T")[0],
      });

      return { success: true, alreadyBlocked: false };
    }),
});
