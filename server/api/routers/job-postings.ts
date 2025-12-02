/**
 * tRPC APIs for job postings (employer functionality)
 */

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  JobPosting,
  JobPostingWithApplications,
} from "@/server/models/responses";
import { db } from "@/server/db";
import { eq, sql } from "drizzle-orm";
import { jobPostingsTable, jobApplicationsTable } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import {
  NewJobPosting,
  UpdateJobPosting,
  JobPostingIdentity,
} from "@/server/models/inputs";

/** Get all job postings (visible to all users) with application counts */
const getAllJobPostings = protectedProcedure
  .output(JobPostingWithApplications.array())
  .query(async () => {
    const postings = await db
      .select({
        id: jobPostingsTable.id,
        employerId: jobPostingsTable.employerId,
        title: jobPostingsTable.title,
        description: jobPostingsTable.description,
        location: jobPostingsTable.location,
        payRate: jobPostingsTable.payRate,
        requirements: jobPostingsTable.requirements,
        startDate: jobPostingsTable.startDate,
        endDate: jobPostingsTable.endDate,
        workersNeeded: jobPostingsTable.workersNeeded,
        status: jobPostingsTable.status,
        createdAt: jobPostingsTable.createdAt,
        updatedAt: jobPostingsTable.updatedAt,
        applicationCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${jobApplicationsTable} 
          WHERE ${jobApplicationsTable.jobId} = ${jobPostingsTable.id}
        )`,
      })
      .from(jobPostingsTable)
      .orderBy(sql`${jobPostingsTable.createdAt} DESC`);

    return postings.map((p) => JobPostingWithApplications.parse(p));
  });

/** Get job postings for the current employer */
const getMyJobPostings = protectedProcedure
  .output(JobPostingWithApplications.array())
  .query(async ({ ctx }) => {
    const { subject } = ctx;
    const postings = await db
      .select({
        id: jobPostingsTable.id,
        employerId: jobPostingsTable.employerId,
        title: jobPostingsTable.title,
        description: jobPostingsTable.description,
        location: jobPostingsTable.location,
        payRate: jobPostingsTable.payRate,
        requirements: jobPostingsTable.requirements,
        startDate: jobPostingsTable.startDate,
        endDate: jobPostingsTable.endDate,
        workersNeeded: jobPostingsTable.workersNeeded,
        status: jobPostingsTable.status,
        createdAt: jobPostingsTable.createdAt,
        updatedAt: jobPostingsTable.updatedAt,
        applicationCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${jobApplicationsTable} 
          WHERE ${jobApplicationsTable.jobId} = ${jobPostingsTable.id}
        )`,
      })
      .from(jobPostingsTable)
      .where(eq(jobPostingsTable.employerId, subject.id))
      .orderBy(sql`${jobPostingsTable.createdAt} DESC`);

    return postings.map((p) => JobPostingWithApplications.parse(p));
  });

/** Get a single job posting */
const getJobPosting = protectedProcedure
  .input(JobPostingIdentity)
  .output(JobPosting)
  .query(async ({ input }) => {
    const posting = await db.query.jobPostingsTable.findFirst({
      where: eq(jobPostingsTable.id, input.id),
    });

    if (!posting) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Job posting not found",
      });
    }

    return JobPosting.parse(posting);
  });

/** Create a new job posting (employer only) */
const createJobPosting = protectedProcedure
  .input(NewJobPosting)
  .output(JobPosting)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;

    const [posting] = await db
      .insert(jobPostingsTable)
      .values({
        employerId: subject.id,
        ...input,
      })
      .returning();

    return JobPosting.parse(posting);
  });

/** Update a job posting (employer only, own postings) */
const updateJobPosting = protectedProcedure
  .input(UpdateJobPosting)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { id, ...updates } = input;

    // Verify ownership
    const posting = await db.query.jobPostingsTable.findFirst({
      where: eq(jobPostingsTable.id, id),
    });

    if (!posting) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Job posting not found",
      });
    }

    if (posting.employerId !== subject.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only edit your own job postings",
      });
    }

    await db
      .update(jobPostingsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobPostingsTable.id, id));
  });

/** Delete a job posting (employer only, own postings) */
const deleteJobPosting = protectedProcedure
  .input(JobPostingIdentity)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;

    // Verify ownership
    const posting = await db.query.jobPostingsTable.findFirst({
      where: eq(jobPostingsTable.id, input.id),
    });

    if (!posting) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Job posting not found",
      });
    }

    if (posting.employerId !== subject.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only delete your own job postings",
      });
    }

    await db.delete(jobPostingsTable).where(eq(jobPostingsTable.id, input.id));
  });

export const jobPostingsApiRouter = createTRPCRouter({
  getAllJobPostings,
  getMyJobPostings,
  getJobPosting,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
});
