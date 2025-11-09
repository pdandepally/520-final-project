/**
 * tRPC APIs that contains all of the functionality for creating,
 * reading, updating, and deleting data in our database relating to
 * channels.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Channel } from "@/server/models/responses";
import { db } from "@/server/db";
import { and, asc, eq, gte } from "drizzle-orm";
import { channelsTable, messagesTable } from "@/server/db/schema";
import {
  enforceServerMembership,
  getChannelAndEnforceServerMembership,
} from "../helpers/enforce-membership";
import {
  ChannelIdentity,
  NewChannel,
  ServerIdentity,
} from "@/server/models/inputs";

import { openai } from "@/utils/openai/client";

/** Gets all channels in a server. */
const getChannels = protectedProcedure
  .input(ServerIdentity)
  .output(Channel.array())
  .query(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { serverId } = input;

    await enforceServerMembership(subject, serverId);

    const channels = await db.query.channelsTable.findMany({
      where: eq(channelsTable.serverId, serverId),
      orderBy: [channelsTable.name],
      columns: {
        id: true,
        name: true,
      },
    });

    return Channel.array().parse(channels);
  });

/** Creates a new channel. */
const createChannel = protectedProcedure
  .input(NewChannel)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { serverId, channelName } = input;

    await enforceServerMembership(subject, serverId);

    await db.insert(channelsTable).values({
      name: channelName,
      serverId: serverId,
    });
  });

/** Edits an existing channel. */
const editChannel = protectedProcedure
  .input(Channel)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { id: channelId, name: newName } = input;

    const channel = await getChannelAndEnforceServerMembership(
      subject,
      channelId,
    );

    await db
      .update(channelsTable)
      .set({ name: newName })
      .where(eq(channelsTable.id, channel.id));
  });

/** Deletes a channel. */
const deleteChannel = protectedProcedure
  .input(ChannelIdentity)
  .mutation(async ({ ctx, input }) => {
    const { subject } = ctx;
    const { channelId } = input;

    const channel = await getChannelAndEnforceServerMembership(
      subject,
      channelId,
    );

    await db.delete(channelsTable).where(eq(channelsTable.id, channel.id));
  });

// [TODO] madhura
// Complete the `summarizeChannel` endpoint. This is a new type of endpoint called a
// *subscription* endpoint. Along with queries and mutations, subscriptions are the
// final type of tRPC endpoint. You can read more about them here:
// @see https://trpc.io/docs/server/subscriptions
//
// Subscriptions are the tRPC primitive for simulating realtime websocket functionality
// using tRPC.
//
// This endpoint will use OpenAI's GPT model to summarize messages in an Alias channel,
// by week, for the previoud four weeks that contain messages (ordered chronologically)
//
// Example expected output from the AI model might look something like:
// ```
// Week 1 (Oct 27, 2025 - Nov 2, 2025)
// John and Jane compared their favorite pizza slices in New York City.
//
// Week 2 (Oct 19, 2025 - Oct 26, 2025)
// Alice and Bob were gossiping about old high school friends.
// ```
//
// Your task is to write the prompt that instructs the model to produce output
// in the format specified above for the messages in your channel. The query
// to fetch the relevant messages has already been provided for you, as well
// as the setup for how to stream the responses from OpenAI's server through
// the websocket connection. You only need to modify the `prompt` variable.
const summarizeChannel = protectedProcedure
  .input(ChannelIdentity)
  .subscription(async function* ({ ctx, input, signal }) {
    // Deconstruct parameters and verify permissions
    const { subject } = ctx;
    const { channelId } = input;
    await getChannelAndEnforceServerMembership(subject, channelId);

    // Queries the messages for the channel within the last four weeks
    // to summarize.
    const fourWeeksAgoUtc = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const messages = await db.query.messagesTable.findMany({
      columns: {
        content: true,
        createdAt: true,
      },
      with: {
        author: {
          columns: {
            displayName: true,
          },
        },
      },
      where: and(
        eq(messagesTable.channelId, channelId),
        gte(messagesTable.createdAt, fourWeeksAgoUtc),
      ),
      orderBy: asc(messagesTable.createdAt),
    });

    // [TODO]: madhura -- Write a prompt to generate the output expected using the
    // provided data from above.
    const prompt = `
    Summarize discussions week by week for the past four weeks that contain messages from a channel. Include the author's first name, date, and discussion summary.
    Only include weeks that have messages when you are considering what constitutes the past four weeks. List the weeks and their summaries in chronological order.
    Use concise language in your discussion summary of the messages. Make the discussion summary 1-2 sentences.

    Format your response in this way:
    "Week <number> (<start date> - <end date>)
    1-2 sentence summary of the disussion here"

    Here is an example response for one week:
    "Week 1 (Oct 27, 2025 - Nov 2, 2025)
     John and Jane compared their favorite pizza slices in New York City."

    Here are the messages:
    ${messages
      .map(
        (m) =>
          `${m.author?.displayName ?? "Unknown"} ${m.createdAt}: ${m.content}`,
      )
      .join("\n")}
    `;

    // This code calls the Azure OpenAI endpoint and streams the result, token by token,
    // in realtime to the backend server.
    const responseStream = await openai.chat.completions.create(
      {
        model: "chat",
        messages: [
          {
            role: "system",
            content:
              "You are a precise assistant. Return only the plain text summary in the exact format requested, with no extra commentary.",
          },
          { role: "user", content: prompt },
        ],
        stream: true,
      },
      { signal },
    );

    // Then, as we recieve tokens from the AI server, we will stream them down to
    // the subscribed client using `yield`.
    for await (const chunk of responseStream) {
      const delta = chunk.choices?.[0]?.delta?.content ?? "";
      if (!delta) continue;
      yield delta;
    }
  });

/**
 * Router for all channel-related APIs.
 */
export const channelsApiRouter = createTRPCRouter({
  getChannels: getChannels,
  createChannel: createChannel,
  editChannel: editChannel,
  deleteChannel: deleteChannel,
  summarizeChannel: summarizeChannel,
});
