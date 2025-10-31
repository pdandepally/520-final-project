/**
 * Configuration for the server-side tRPC API, including the primary API router.
 * Configuration of the server-side tRPC API.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @license MIT
 * @see https://comp426-25f.github.io/
 */

import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { channelsApiRouter } from "./routers/channels";
import { messagesApiRouter } from "./routers/messages";
import { profilesApiRouter } from "./routers/profiles";
import { serversApiRouter } from "./routers/servers";

/** Primary router for the API server. */
export const appRouter = createTRPCRouter({
  channels: channelsApiRouter,
  messages: messagesApiRouter,
  profiles: profilesApiRouter,
  servers: serversApiRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
