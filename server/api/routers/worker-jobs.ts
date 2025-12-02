/**
 * tRPC APIs for worker job history (worker functionality)
 */

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { WorkerJobHistory } from "@/server/models/responses";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { workerJobHistoryTable } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import {
  NewWorkerJobHistory,
  UpdateWorkerJobHistory,
  WorkerJobHistoryIdentity,
} from "@/server/models/inputs";

/** Get all job history for the current worker */
const getMyJobHistory = protectedProcedure
  .output(WorkerJobHistory.array())
  .query(async ({ ctx }) => {
    const { subject } = ctx;
    const history = await db.query.workerJobHistoryTable.findMany({
      where: eq(workerJobHistoryTable.workerId, subject.id),
      orderBy: (workerJobHistoryTable, { desc }) => [
        desc(workerJobHistoryTable.startDate),
      ],
    });
    return history.map((h) => WorkerJobHistory.parse(h));
  });

/** Create a new job history entry (worker only) */
const addJobHistory = protectedProcedure
  .input(NewWorkerJobHistory)
  .output(WorkerJobHistory)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;

    const [history] = await db
      .insert(workerJobHistoryTable)
      .values({
        workerId: subject.id,
        ...input,
      })
      .returning();

    return WorkerJobHistory.parse(history);
  });

/** Update a job history entry (worker only, own entries) */
const updateJobHistory = protectedProcedure
  .input(UpdateWorkerJobHistory)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { id, ...updates } = input;

    // Verify ownership
    const history = await db.query.workerJobHistoryTable.findFirst({
      where: eq(workerJobHistoryTable.id, id),
    });

    if (!history) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Job history entry not found",
      });
    }

    if (history.workerId !== subject.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only edit your own job history",
      });
    }

    await db
      .update(workerJobHistoryTable)
      .set(updates)
      .where(eq(workerJobHistoryTable.id, id));
  });

/** Delete a job history entry (worker only, own entries) */
const deleteJobHistory = protectedProcedure
  .input(WorkerJobHistoryIdentity)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;

    // Verify ownership
    const history = await db.query.workerJobHistoryTable.findFirst({
      where: eq(workerJobHistoryTable.id, input.id),
    });

    if (!history) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Job history entry not found",
      });
    }

    if (history.workerId !== subject.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only delete your own job history",
      });
    }

    await db
      .delete(workerJobHistoryTable)
      .where(eq(workerJobHistoryTable.id, input.id));
  });

export const workerJobsApiRouter = createTRPCRouter({
  getMyJobHistory,
  addJobHistory,
  updateJobHistory,
  deleteJobHistory,
});
