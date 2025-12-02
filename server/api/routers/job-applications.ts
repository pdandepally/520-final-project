/**
 * Job Applications Router - handles workers applying to jobs
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  jobApplicationsTable,
  jobPostingsTable,
  profilesTable,
} from "@/server/db/schema";
import { NewJobApplication } from "@/server/models/inputs";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";

export const jobApplicationsRouter = createTRPCRouter({
  // Apply to a job
  applyToJob: protectedProcedure
    .input(NewJobApplication)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.subject.id;

      // Check if job exists and get worker count
      const job = await db
        .select({
          id: jobPostingsTable.id,
          workersNeeded: jobPostingsTable.workersNeeded,
          status: jobPostingsTable.status,
          applicationCount: sql<number>`(
            SELECT COUNT(*)::int 
            FROM ${jobApplicationsTable} 
            WHERE ${jobApplicationsTable.jobId} = ${jobPostingsTable.id}
          )`,
        })
        .from(jobPostingsTable)
        .where(eq(jobPostingsTable.id, input.jobId))
        .limit(1);

      if (!job || job.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      const jobData = job[0];

      // Check if job is still active
      if (jobData.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This job is no longer accepting applications",
        });
      }

      // Check if already at capacity
      if (jobData.applicationCount! >= jobData.workersNeeded!) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This job has reached its worker limit",
        });
      }

      // Check if already applied
      const existingApplication = await db
        .select()
        .from(jobApplicationsTable)
        .where(
          and(
            eq(jobApplicationsTable.jobId, input.jobId),
            eq(jobApplicationsTable.workerId, userId),
          ),
        )
        .limit(1);

      if (existingApplication.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already applied to this job",
        });
      }

      // Create application
      const result = await db
        .insert(jobApplicationsTable)
        .values({
          jobId: input.jobId,
          workerId: userId,
        })
        .returning();

      return result[0];
    }),

  // Withdraw application
  withdrawApplication: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.subject.id;

      const result = await db
        .delete(jobApplicationsTable)
        .where(
          and(
            eq(jobApplicationsTable.jobId, input.jobId),
            eq(jobApplicationsTable.workerId, userId),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      return result[0];
    }),

  // Get my applications (for workers)
  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.subject.id;

    const applications = await db
      .select({
        id: jobApplicationsTable.id,
        jobId: jobApplicationsTable.jobId,
        workerId: jobApplicationsTable.workerId,
        status: jobApplicationsTable.status,
        appliedAt: jobApplicationsTable.appliedAt,
        jobTitle: jobPostingsTable.title,
        jobDescription: jobPostingsTable.description,
        jobLocation: jobPostingsTable.location,
        jobPayRate: jobPostingsTable.payRate,
        jobStatus: jobPostingsTable.status,
      })
      .from(jobApplicationsTable)
      .innerJoin(
        jobPostingsTable,
        eq(jobApplicationsTable.jobId, jobPostingsTable.id),
      )
      .where(eq(jobApplicationsTable.workerId, userId));

    return applications;
  }),

  // Get applications for a job (for employers)
  getJobApplications: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the job
      const job = await db
        .select()
        .from(jobPostingsTable)
        .where(eq(jobPostingsTable.id, input.jobId))
        .limit(1);

      if (job.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      if (job[0].employerId !== ctx.subject.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not own this job posting",
        });
      }

      const applications = await db
        .select()
        .from(jobApplicationsTable)
        .where(eq(jobApplicationsTable.jobId, input.jobId));

      return applications;
    }),

  // Check if user has applied to a job
  hasApplied: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      const application = await db
        .select()
        .from(jobApplicationsTable)
        .where(
          and(
            eq(jobApplicationsTable.jobId, input.jobId),
            eq(jobApplicationsTable.workerId, ctx.subject.id),
          ),
        )
        .limit(1);

      return application.length > 0;
    }),

  // Get applications for a job with worker details (for employers)
  getApplicationsForJob: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the job
      const job = await db
        .select()
        .from(jobPostingsTable)
        .where(eq(jobPostingsTable.id, input.jobId))
        .limit(1);

      if (job.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      if (job[0].employerId !== ctx.subject.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not own this job posting",
        });
      }

      // Get applications with worker profile details
      const applications = await db
        .select({
          applicationId: jobApplicationsTable.id,
          workerId: jobApplicationsTable.workerId,
          status: jobApplicationsTable.status,
          appliedAt: jobApplicationsTable.appliedAt,
          workerName: profilesTable.displayName,
          workerUsername: profilesTable.username,
        })
        .from(jobApplicationsTable)
        .innerJoin(
          profilesTable,
          eq(jobApplicationsTable.workerId, profilesTable.id),
        )
        .where(eq(jobApplicationsTable.jobId, input.jobId));

      return applications;
    }),
});
