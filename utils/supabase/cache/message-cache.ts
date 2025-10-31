/**
 * This file contains utility functions for updating the message data
 * cached by React Query.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { z } from "zod";
import { DraftMessage, Message, Profile } from "@/server/models/responses";
import { api } from "@/utils/trpc/api";

type TrpcUtils = ReturnType<typeof api.useUtils>;

/** Generates a function that adds a message to the cache. */
export const addMessageToCacheFn =
  (
    apiUtils: TrpcUtils,
    channelId: string,
    members: z.infer<typeof Profile>[] | undefined
  ) =>
  (newMessage: z.infer<typeof DraftMessage>) => {
    apiUtils.messages.getPaginatedMessages.setInfiniteData(
      { channelId },
      (oldData) => {
        const user = members?.find(
          (member) => member.id === newMessage.authorId
        );

        return {
          pageParams: oldData?.pageParams ?? [],
          pages:
            oldData?.pages.map((page, index) =>
              index === 0
                ? [Message.parse({ author: user, ...newMessage }), ...page]
                : page
            ) ?? [],
        };
      }
    );
  };

/** Generates a function that updates a message in the cache. */
export const updateMessageInCacheFn =
  (
    apiUtils: TrpcUtils,
    channelId: string,
    members: z.infer<typeof Profile>[] | undefined
  ) =>
  (updatedMessage: z.infer<typeof DraftMessage>) => {
    apiUtils.messages.getPaginatedMessages.setInfiniteData(
      { channelId },
      (oldData) => {
        const user = members?.find(
          (member) => member.id === updatedMessage.authorId
        );

        return {
          pageParams: oldData?.pageParams ?? [],
          pages:
            oldData?.pages.map((page) =>
              page.map((message) =>
                message.id === updatedMessage.id
                  ? Message.parse({ author: user, ...updatedMessage })
                  : message
              )
            ) ?? [],
        };
      }
    );
  };

/** Generates a function that deletes a message from the cache. */
export const deleteMessageFromCacheFn =
  (apiUtils: TrpcUtils, channelId: string) => (messageId: string) => {
    apiUtils.messages.getPaginatedMessages.setInfiniteData(
      { channelId },
      (oldData) => {
        return {
          pageParams: oldData?.pageParams ?? [],
          pages:
            oldData?.pages.map((page) =>
              page.filter((message) => message.id !== messageId)
            ) ?? [],
        };
      }
    );
  };
