import { db } from "@/server/db";
import { channelsTable, serverMembershipsTable } from "@/server/db/schema";
import { Subject } from "@/server/models/auth";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

export const enforceServerMembership = async (
  subject: Subject,
  serverId: string
) => {
  const channelMembership = await db.query.serverMembershipsTable.findFirst({
    where: and(
      eq(serverMembershipsTable.profileId, subject.id),
      eq(serverMembershipsTable.serverId, serverId)
    ),
  });

  if (!channelMembership) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message:
        "The user cannot perform action for servers they are not part of.",
    });
  }
};

export const getChannelAndEnforceServerMembership = async (
  subject: Subject,
  channelId: string
) => {
  const channel = await db.query.channelsTable.findFirst({
    where: eq(channelsTable.id, channelId),
  });

  if (!channel || !channel.serverId)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Cannot operate on a channel that does not exist!",
    });

  await enforceServerMembership(subject, channel.serverId);

  return channel;
};
