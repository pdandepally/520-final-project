import { createTRPCRouter, protectedProcedure } from "../trpc";
import { DraftMessage, Message } from "@/server/models/responses";
import { getChannelAndEnforceServerMembership } from "../helpers/enforce-membership";
import { db } from "@/server/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { messagesTable, reactionsTable } from "@/server/db/schema";
import {
  NewReaction,
  PaginatedMessagesRequest,
  RemoveReactionRequest,
} from "@/server/models/inputs";

/** Gets a paginated list of messages for a certain channel given a search query. */
const getPaginatedMessages = protectedProcedure
  .input(PaginatedMessagesRequest)
  .output(Message.array())
  .query(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { channelId, cursor, textSearch } = input;

    await getChannelAndEnforceServerMembership(subject, channelId);

    const filter = textSearch
      ? and(
          eq(messagesTable.channelId, channelId),
          sql`to_tsvector('english', ${messagesTable.content}) @@ plainto_tsquery('english', ${textSearch})`,
        )
      : eq(messagesTable.channelId, channelId);

    const messages = await db.query.messagesTable.findMany({
      where: filter,
      orderBy: desc(messagesTable.createdAt),
      offset: cursor,
      limit: cursor + 50,
      columns: {
        id: true,
        content: true,
        createdAt: true,
        attachmentUrl: true,
      },
      with: {
        author: {
          columns: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        reactions: {
          columns: {
            id: true,
            reaction: true,
            profileId: true,
          },
        },
      },
    });

    return Message.array().parse(messages);
  });

/** Sends a message in a channel. */
const sendMessage = protectedProcedure
  .input(DraftMessage)
  .output(DraftMessage)
  .mutation(async ({ ctx, input: draftMessage }) => {
    const { subject } = ctx;

    await getChannelAndEnforceServerMembership(subject, draftMessage.channelId);

    const [newMessage] = await db
      .insert(messagesTable)
      .values({ ...draftMessage, createdAt: undefined })
      .returning({
        id: messagesTable.id,
        content: messagesTable.content,
        createdAt: messagesTable.createdAt,
        attachmentUrl: messagesTable.attachmentUrl,
        authorId: messagesTable.authorId,
        channelId: messagesTable.channelId,
      });

    return DraftMessage.parse(newMessage);
  });

/** Adds a new reaction to a message. */
const addReactionToMessage = protectedProcedure
  .input(NewReaction)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { channelId, messageId, emoji } = input;

    await getChannelAndEnforceServerMembership(subject, channelId);

    await db.insert(reactionsTable).values({
      messageId: messageId,
      profileId: subject.id,
      channelId: channelId,
      reaction: emoji,
    });
  });

/** Removes an existing message from a reaction. */
const removeReactionFromMessage = protectedProcedure
  .input(RemoveReactionRequest)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { channelId, messageId, emoji } = input;

    await getChannelAndEnforceServerMembership(subject, channelId);

    await db
      .delete(reactionsTable)
      .where(
        and(
          eq(reactionsTable.messageId, messageId),
          eq(reactionsTable.profileId, subject.id),
          eq(reactionsTable.reaction, emoji),
        ),
      );
  });

/**
 * Router for all messages-related APIs.
 */
export const messagesApiRouter = createTRPCRouter({
  getPaginatedMessages: getPaginatedMessages,
  sendMessage: sendMessage,
  addReactionToMessage: addReactionToMessage,
  removeReactionFromMessage: removeReactionFromMessage,
});
