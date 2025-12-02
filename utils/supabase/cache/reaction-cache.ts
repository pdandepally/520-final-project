import { z } from "zod";
import { MessageReaction } from "@/server/models/responses";
import { api } from "@/utils/trpc/api";

type TrpcUtils = ReturnType<typeof api.useUtils>;

/** Generates a function that adds a reaction to the cache. */
export const addReactionToCacheFn =
  (apiUtils: TrpcUtils, channelId: string) =>
  (messageId: string, reaction: z.infer<typeof MessageReaction>) => {
    apiUtils.messages.getPaginatedMessages.setInfiniteData(
      { channelId },
      (oldData) => {
        if (!oldData) return oldData;

        return {
          pageParams: [...(oldData.pageParams ?? [])],
          pages: oldData.pages.map((page) =>
            page.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    reactions: [...message.reactions, reaction],
                  }
                : message,
            ),
          ),
        };
      },
    );
  };

/** Generates a function that removes a reaction from the cache. */
export const removeReactionFromCacheFn =
  (apiUtils: TrpcUtils, channelId: string) => (reactionId: string) => {
    apiUtils.messages.getPaginatedMessages.setInfiniteData(
      { channelId },
      (oldData) => {
        if (!oldData) return oldData;

        return {
          pageParams: [...(oldData.pageParams ?? [])],
          pages: oldData.pages.map((page) =>
            page.map((message) => ({
              ...message,
              reactions: message.reactions.filter(
                (reaction) => reaction.id !== reactionId,
              ),
            })),
          ),
        };
      },
    );
  };
