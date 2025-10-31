/**
 * This file contains all of the Zod validation models
 * used to ensure that our tRPC API functions accept
 * input data in the correct format.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { z } from "zod";

export const ServerIdentity = z.object({ serverId: z.string() });

export const ChannelIdentity = z.object({ channelId: z.string() });

export const ProfileIdentity = z.object({ profileId: z.string() });
export const NewChannel = z.object({
  serverId: z.string(),
  channelName: z.string(),
});

export const PaginatedMessagesRequest = z.object({
  channelId: z.string(),
  cursor: z.number().default(0),
  textSearch: z.string().optional(),
});

export const NewReaction = z.object({
  channelId: z.string(),
  messageId: z.string(),
  emoji: z.string(),
});

export const RemoveReactionRequest = NewReaction;

export const NewProfileImage = z.object({ avatarUrl: z.string().optional() });

export const NewDisplayName = z.object({ newDisplayName: z.string() });

export const NewProfile = z.object({
  displayName: z.string(),
  username: z.string(),
});
