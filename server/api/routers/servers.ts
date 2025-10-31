/**
 * tRPC APIs that contains all of the functionality for creating,
 * reading, updating, and deleting data in our database relating to
 * servers.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { Profile, EditedServer, Server } from "@/server/models/responses";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { and, eq, inArray } from "drizzle-orm";
import {
  channelsTable,
  serverMembershipsTable,
  serversTable,
} from "@/server/db/schema";
import z from "zod";
import { enforceServerMembership } from "../helpers/enforce-membership";
import { TRPCError } from "@trpc/server";

/** Gets a list of servers that the user is a member of. */
const getServers = protectedProcedure
  .output(Server.array())
  .query(async ({ ctx }) => {
    const { subject } = ctx;

    const memberships = await db.query.serverMembershipsTable.findMany({
      where: eq(serverMembershipsTable.profileId, subject.id),
      columns: {
        serverId: true,
      },
    });

    const memberServerIds = memberships.map((memership) => memership.serverId);

    const servers = await db.query.serversTable.findMany({
      where: inArray(serversTable.id, memberServerIds),
      orderBy: [serversTable.name],
      columns: {
        id: true,
        name: true,
        serverImageUrl: true,
        serverCreatorId: true,
      },
      with: {
        channels: {
          orderBy: [channelsTable.name],
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    return Server.array().parse(servers);
  });

/** Gets the members of a server given its ID */
const getServerMembers = protectedProcedure
  .input(z.object({ serverId: z.string() }))
  .output(Profile.array())
  .query(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { serverId } = input;

    await enforceServerMembership(subject, serverId);

    const memberships = await db.query.serverMembershipsTable.findMany({
      where: eq(serverMembershipsTable.serverId, serverId),
      with: {
        profile: {
          columns: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    const members = memberships.map((membership) => membership.profile);

    return Profile.array().parse(members);
  });

/** Gets one server by its ID. */
const getServer = protectedProcedure
  .input(z.object({ serverId: z.string() }))
  .output(Server.nullable())
  .query(async ({ input }) => {
    const { serverId } = input;

    const server = await db.query.serversTable.findFirst({
      where: eq(serversTable.id, serverId),
      columns: {
        id: true,
        name: true,
        serverImageUrl: true,
        serverCreatorId: true,
      },
      with: {
        channels: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    return Server.nullable().parse(server);
  });

/** Edits a server. */
const editServer = protectedProcedure
  .input(EditedServer)
  .mutation(async ({ ctx, input: editedServer }) => {
    const { subject } = ctx;

    await enforceServerMembership(subject, editedServer.id);

    await db
      .update(serversTable)
      .set(editedServer)
      .where(eq(serversTable.id, editedServer.id));
  });

/** Deletes a server. */
const deleteServer = protectedProcedure
  .input(z.object({ serverId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { serverId } = input;

    await enforceServerMembership(subject, serverId);

    await db.delete(serversTable).where(eq(serversTable.id, serverId));
  });

/** Creates a new sever and makes the creator the owner of the server. */
const createServer = protectedProcedure
  .input(z.object({ serverName: z.string() }))
  .output(Server)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { serverName } = input;

    const [createdServer] = await db
      .insert(serversTable)
      .values({
        name: serverName,
        serverCreatorId: subject.id,
      })
      .returning({ id: serversTable.id });

    // Create the general channel
    await db.insert(channelsTable).values({
      name: "general",
      serverId: createdServer.id,
    });

    // Add the user to the server
    await db.insert(serverMembershipsTable).values({
      serverId: createdServer.id,
      profileId: subject.id,
    });

    // Return the final server
    const finalServer = await db.query.serversTable.findFirst({
      where: eq(serversTable.id, createdServer.id),
      columns: {
        id: true,
        name: true,
        serverImageUrl: true,
        serverCreatorId: true,
      },
      with: {
        channels: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!finalServer) throw new TRPCError({ code: "NOT_FOUND" });

    return Server.parse(finalServer);
  });

/** Changes a server's image */
const changeServerImage = protectedProcedure
  .input(z.object({ serverId: z.string(), imageUrl: z.string().nullable() }))
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { serverId, imageUrl } = input;

    await enforceServerMembership(subject, serverId);

    await db
      .update(serversTable)
      .set({ serverImageUrl: imageUrl })
      .where(eq(serversTable.id, serverId));
  });

/** Joins the authenticated user to a new server. */
const joinServer = protectedProcedure
  .input(z.object({ serverId: z.string() }))
  .output(Server)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { serverId } = input;

    await db
      .insert(serverMembershipsTable)
      .values({ serverId: serverId, profileId: subject.id });

    const server = await db.query.serversTable.findFirst({
      where: eq(serversTable.id, serverId),
      columns: {
        id: true,
        name: true,
        serverImageUrl: true,
        serverCreatorId: true,
      },
      with: {
        channels: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!server) throw new TRPCError({ code: "NOT_FOUND" });

    return Server.parse(server);
  });

/** Removes server membership for a server for the authenticated user. */
const leaveServer = protectedProcedure
  .input(z.object({ serverId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { serverId } = input;

    await db
      .delete(serverMembershipsTable)
      .where(
        and(
          eq(serverMembershipsTable.profileId, subject.id),
          eq(serverMembershipsTable.serverId, serverId)
        )
      );
  });

/**
 * Router for all server-related APIs.
 */
export const serversApiRouter = createTRPCRouter({
  getServers: getServers,
  getServerMembers: getServerMembers,
  getServer: getServer,
  editServer: editServer,
  deleteServer: deleteServer,
  createServer: createServer,
  changeServerImage: changeServerImage,
  joinServer: joinServer,
  leaveServer: leaveServer,
});
