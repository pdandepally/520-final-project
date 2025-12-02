import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { channelsApiRouter } from "./routers/channels";
import { messagesApiRouter } from "./routers/messages";
import { profilesApiRouter } from "./routers/profiles";
import { serversApiRouter } from "./routers/servers";
import { workersApiRouter } from "./routers/workers";
import { jobPostingsApiRouter } from "./routers/job-postings";
import { workerJobsApiRouter } from "./routers/worker-jobs";
import { jobApplicationsRouter } from "./routers/job-applications";

/** Primary router for the API server. */
export const appRouter = createTRPCRouter({
  channels: channelsApiRouter,
  messages: messagesApiRouter,
  profiles: profilesApiRouter,
  servers: serversApiRouter,
  workers: workersApiRouter,
  jobPostings: jobPostingsApiRouter,
  workerJobs: workerJobsApiRouter,
  jobApplications: jobApplicationsRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
