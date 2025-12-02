/**
 * tRPC APIs that contains all of the functionality for creating,
 * reading, updating, and deleting data in our database relating to
 * workers and their employment information.
 *
 * @author GitHub Copilot
 */

import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  Worker,
  WorkerWithDetails,
  WorkHistory,
  Skill,
  Document,
} from "@/server/models/responses";
import { db } from "@/server/db";
import { eq, desc } from "drizzle-orm";
import {
  workersTable,
  workHistoryTable,
  skillsTable,
  documentsTable,
} from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import {
  WorkerIdentity,
  NewWorker,
  UpdateWorker,
  NewWorkHistory,
  UpdateWorkHistory,
  WorkHistoryIdentity,
  NewSkill,
  UpdateSkill,
  SkillIdentity,
  NewDocument,
  DocumentIdentity,
} from "@/server/models/inputs";

/** Gets all workers. */
const getAllWorkers = protectedProcedure
  .output(Worker.array())
  .query(async () => {
    const workers = await db.query.workersTable.findMany({
      orderBy: [desc(workersTable.createdAt)],
    });
    return workers.map((worker) => Worker.parse(worker));
  });

/** Gets a worker by ID with all related data. */
const getWorker = protectedProcedure
  .input(WorkerIdentity)
  .output(WorkerWithDetails)
  .query(async ({ input }) => {
    const { workerId } = input;

    const worker = await db.query.workersTable.findFirst({
      where: eq(workersTable.id, workerId),
      with: {
        workHistory: {
          orderBy: [desc(workHistoryTable.startDate)],
        },
        skills: true,
        documents: true,
      },
    });

    if (!worker)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Worker not found.",
      });

    return WorkerWithDetails.parse(worker);
  });

/** Creates a new worker. */
const createWorker = protectedProcedure
  .input(NewWorker)
  .output(Worker)
  .mutation(async ({ input }) => {
    const [newWorker] = await db.insert(workersTable).values(input).returning();

    if (!newWorker)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create worker.",
      });

    return Worker.parse(newWorker);
  });

/** Updates a worker's information. */
const updateWorker = protectedProcedure
  .input(UpdateWorker)
  .mutation(async ({ input }) => {
    const { workerId, ...updates } = input;

    await db
      .update(workersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workersTable.id, workerId));
  });

/** Deletes a worker and all associated data. */
const deleteWorker = protectedProcedure
  .input(WorkerIdentity)
  .mutation(async ({ input }) => {
    const { workerId } = input;

    await db.delete(workersTable).where(eq(workersTable.id, workerId));
  });

/** Adds work history for a worker. */
const addWorkHistory = protectedProcedure
  .input(NewWorkHistory)
  .output(WorkHistory)
  .mutation(async ({ input }) => {
    const [history] = await db
      .insert(workHistoryTable)
      .values(input)
      .returning();

    if (!history)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add work history.",
      });

    return WorkHistory.parse(history);
  });

/** Updates work history entry. */
const updateWorkHistory = protectedProcedure
  .input(UpdateWorkHistory)
  .mutation(async ({ input }) => {
    const { id, ...updates } = input;

    await db
      .update(workHistoryTable)
      .set(updates)
      .where(eq(workHistoryTable.id, id));
  });

/** Deletes work history entry. */
const deleteWorkHistory = protectedProcedure
  .input(WorkHistoryIdentity)
  .mutation(async ({ input }) => {
    const { id } = input;

    await db.delete(workHistoryTable).where(eq(workHistoryTable.id, id));
  });

/** Adds a skill for a worker. */
const addSkill = protectedProcedure
  .input(NewSkill)
  .output(Skill)
  .mutation(async ({ input }) => {
    const [skill] = await db.insert(skillsTable).values(input).returning();

    if (!skill)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add skill.",
      });

    return Skill.parse(skill);
  });

/** Updates a skill. */
const updateSkill = protectedProcedure
  .input(UpdateSkill)
  .mutation(async ({ input }) => {
    const { id, ...updates } = input;

    await db.update(skillsTable).set(updates).where(eq(skillsTable.id, id));
  });

/** Deletes a skill. */
const deleteSkill = protectedProcedure
  .input(SkillIdentity)
  .mutation(async ({ input }) => {
    const { id } = input;

    await db.delete(skillsTable).where(eq(skillsTable.id, id));
  });

/** Adds a document for a worker. */
const addDocument = protectedProcedure
  .input(NewDocument)
  .output(Document)
  .mutation(async ({ input }) => {
    const [document] = await db
      .insert(documentsTable)
      .values(input)
      .returning();

    if (!document)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add document.",
      });

    return Document.parse(document);
  });

/** Deletes a document. */
const deleteDocument = protectedProcedure
  .input(DocumentIdentity)
  .mutation(async ({ input }) => {
    const { id } = input;

    await db.delete(documentsTable).where(eq(documentsTable.id, id));
  });

/**
 * Router for all worker-related APIs.
 */
export const workersApiRouter = createTRPCRouter({
  getAllWorkers: getAllWorkers,
  getWorker: getWorker,
  createWorker: createWorker,
  updateWorker: updateWorker,
  deleteWorker: deleteWorker,
  addWorkHistory: addWorkHistory,
  updateWorkHistory: updateWorkHistory,
  deleteWorkHistory: deleteWorkHistory,
  addSkill: addSkill,
  updateSkill: updateSkill,
  deleteSkill: deleteSkill,
  addDocument: addDocument,
  deleteDocument: deleteDocument,
});
