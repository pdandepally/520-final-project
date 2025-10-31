/**
 * This file contains all of the Zod validation models
 * used to ensure that our tRPC API functions ultimately
 * return data in the correct format.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { z } from "zod";
import { convertKeysToCamelCase } from "../api/helpers/camel-case";

export const Channel = z.object({
  id: z.string(),
  name: z.string(),
});

export const Server = z.object({
  id: z.string(),
  name: z.string(),
  serverImageUrl: z.string().nullable(),
  channels: Channel.array(),
  serverCreatorId: z.string(),
});

export const EditedServer = Server.omit({
  channels: true,
  serverCreatorId: true,
});

export const Profile = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
});

export const MessageReaction = z.object({
  id: z.string(),
  reaction: z.string(),
  profileId: z.string(),
});

export const MessageReactionWithoutId = MessageReaction.omit({ id: true });

export const Message = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date({ coerce: true }).nullable().default(null),
  attachmentUrl: z.string().nullable(),
  author: Profile,
  reactions: MessageReaction.array().default([]),
});

export const DraftMessage = z.preprocess(
  (data) => convertKeysToCamelCase(data),
  z.object({
    id: z.string(),
    content: z.string(),
    authorId: z.string(),
    channelId: z.string(),
    attachmentUrl: z.string().nullable(),
    createdAt: z.coerce.date().nullable(),
  }),
);

export const Reaction = z.preprocess(
  (data) => convertKeysToCamelCase(data),
  z.object({
    id: z.string(),
    messageId: z.string(),
    reaction: z.string(),
    profileId: z.string(),
  }),
);
