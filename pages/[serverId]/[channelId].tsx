import MessageView from "@/components/server/message-view";
import { ServerChannelSidebar } from "@/components/server/server-channel-sidebar";
import ServerHeader from "@/components/server/server-header";
import { ServerUserSidebar } from "@/components/server/server-user-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import {
  DraftMessage,
  MessageReaction,
} from "@/server/models/responses";
import { User } from "@supabase/supabase-js";
import { ImageIcon, SmilePlus, Upload, X } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { useDebounce } from "use-debounce";
import { InView } from "react-intersection-observer";
import { toast } from "sonner";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import EmojiPopoverContent from "@/components/server/emoji-popover-content";
import { cn } from "@/lib/utils";
import {
  addMessageToCacheFn,
  deleteMessageFromCacheFn,
  updateMessageInCacheFn,
} from "@/utils/supabase/cache/message-cache";
import {
  addReactionToCacheFn,
  removeReactionFromCacheFn,
} from "@/utils/supabase/cache/reaction-cache";
import { api } from "@/utils/trpc/api";
import { uploadAttachmentToSupabase } from "@/utils/supabase/storage";
//import { channel } from "diagnostics_channel";

export type ChannelPageProps = { user: User };
export default function ChannelPage({ user }: ChannelPageProps) {
  // Hook into utilities
  const apiUtils = api.useUtils();
  const router = useRouter();
  const supabase = createSupabaseComponentClient();

  // Extract the server and channel IDs from the query parameters.
  const { serverId: serverIdQuery, channelId: channelIdQuery } = router.query;
  const serverId = serverIdQuery as string;
  const channelId = channelIdQuery as string;

  // Fetch the currently selected server
  const { data: server } = api.servers.getServer.useQuery(
    {
      serverId,
    },
    { enabled: !!serverId },
  );

  // Fetch the channels for the currently selected server
  const { data: channels } = api.channels.getChannels.useQuery(
    { serverId },
    { enabled: !!serverId },
  );

  // Fetch the messages for the currently selected channel
  // This query is paginated using infinite scrolling
  const { data: messages, fetchNextPage: fetchNext } =
    api.messages.getPaginatedMessages.useInfiniteQuery(
      {
        channelId,
      },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage, pages) => pages.length * lastPage.length,
        enabled: !!channelId,
      },
    );

  // Handle the filter query for messages
  // The `filterQuery` is used to store the text that the user has entered into the
  // message filter input. The `debouncedFilterQuery` is used to store the debounced
  // version of the `filterQuery`. This debounced query only changes at most once
  // every 500ms, and this is used to throttle the filter requests made to the
  // filter message query. So, even if 5 characters were typed in 500ms, only one
  // request would be made to the server rather than 5 for every character.
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [debouncedFilterQuery] = useDebounce(filterQuery, 500);

  // Determine if any message filter is active
  const isFilterActive = debouncedFilterQuery.length > 0;

  // Fetch the filtered messages for the currently selected channel
  const { data: filteredMessages, fetchNextPage: filteredFetchNext } =
    api.messages.getPaginatedMessages.useInfiniteQuery(
      {
        channelId,
        textSearch: debouncedFilterQuery,
      },
      {
        initialCursor: 0,
        getNextPageParam: (lastPage, pages) => pages.length * lastPage.length,
        enabled: !!channelId && isFilterActive,
      },
    );

  // Fetch the members for the currently selected server
  const { data: members } = api.servers.getServerMembers.useQuery(
    { serverId },
    { enabled: !!serverId },
  );

  // Mutation to send a message
  const { mutate: sendMessage } = api.messages.sendMessage.useMutation();

  // Mutation to add a reaction
  const { mutate: addReactionToMessage } =
    api.messages.addReactionToMessage.useMutation();

  // Mutation to remove a reaction
  const { mutate: removeReactionFromMessage } =
    api.messages.removeReactionFromMessage.useMutation();

  // The following methods are used for the optimistic updates of messages
  // and reactions by performing operations on the React Query cache that
  // stores loaded data. This ensures that the UX for sending / deleting
  // messages and reactions is immediate and the user is not waiting for
  // the network request to succeed before seeing the effect on the UI. Then,
  // if the network request succeeds, the client and server state are in sync
  // and no further fetches have to occur. If the network request fails, then
  // the optimistic update is rolled back and the cache is changed to its
  // previous state so that the state of the client and server data remain synced.
  //
  // Optimistic updating is a common pattern used in large scale applications and
  // makes apps feel significantly more responsive.
  //
  // These functions are memoized using `useCallback`, ensuring that they do not
  // get redefined every re-render unless an item it depends on (via the
  // dependency array) changes. This is important for performance reasons as
  // these functions are passed as dependencies to the `useEffect` hook and
  // we do not want the `useEffect` hook to re-run every time the component
  // re-renders.
  //
  // The specific implementation here makes use of higher order functions to
  // generate the functions that are used for optimistic updates using parameters
  // that are loaded in by the component.

  // This function is used for optimistically adding a new message when the
  // user posts a message.
  const addMessageToCache = useCallback(
    (newMessage: z.infer<typeof DraftMessage>) =>
      addMessageToCacheFn(apiUtils, channelId, members)(newMessage),
    [channelId, members, apiUtils],
  );

  // This function is used for optimistically updating a message when an
  // existing message is edited in some way (used for image uploads)
  const updateMessageInCache = useCallback(
    (updatedMessage: z.infer<typeof DraftMessage>) =>
      updateMessageInCacheFn(apiUtils, channelId, members)(updatedMessage),
    [channelId, members, apiUtils],
  );

  // This function is used for optimistically deleting a message when a message
  // is deleted (or for rolling back an optimistic insert that failed).
  const deleteMessageFromCache = useCallback(
    (messageId: string) =>
      deleteMessageFromCacheFn(apiUtils, channelId)(messageId),
    [channelId, apiUtils],
  );

  // This function is used for optimistically adding a reaction to a message
  // when a user adds a reaction to a message.
  const addReactionToCache = useCallback(
    (messageId: string, reaction: z.infer<typeof MessageReaction>) =>
      addReactionToCacheFn(apiUtils, channelId)(messageId, reaction),
    [channelId, apiUtils],
  );

  // This function is used for optimistically removing a reaction from a message
  // when a user removes a reaction from a message.
  const removeReactionFromCache = useCallback(
    (reactionId: string) =>
      removeReactionFromCacheFn(apiUtils, channelId)(reactionId),
    [channelId, apiUtils],
  );

  useEffect(() => {
    if (!channelId) return;

    const messageChannel = supabase
      .channel(`messages-${channelId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          const newMessage = payload.new;
          if (newMessage.author_id !== user.id) {
            addMessageToCache({
              id: newMessage.id,
              content: newMessage.content,
              authorId: newMessage.author_id,
              channelId: newMessage.channel_id,
              attachmentUrl: newMessage.attachment_url,
              createdAt: new Date(newMessage.created_at)
            });
          } else {
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          const updatedMessage = payload.new;
          updateMessageInCache({
            id: updatedMessage.id,
            content: updatedMessage.content,
            authorId: updatedMessage.author_id,
            channelId: updatedMessage.channel_id,
            attachmentUrl: updatedMessage.attachment_url,
            createdAt: new Date(updatedMessage.created_at)
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          const deletedMessage = payload.old;
          deleteMessageFromCache(deletedMessage.id);
        }
      );

    const reactionChannel = supabase
      .channel(`reactions-${channelId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          const newReaction = payload.new;
          if (newReaction.profile_id !== user.id) {
            addReactionToCache(newReaction.message_id, {
              id: newReaction.id,
              reaction: newReaction.reaction,
              profileId: newReaction.profile_id
            });
            // Force a refetch to ensure UI updates
            apiUtils.messages.getPaginatedMessages.refetch({ channelId });
          } else {
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reactions',
        },
        (payload) => {
          const deletedReaction = payload.old;
          removeReactionFromCache(deletedReaction.id);
          // Force a refetch to ensure UI updates
          apiUtils.messages.getPaginatedMessages.refetch({ channelId });
        }
      );

    messageChannel.subscribe();
    reactionChannel.subscribe();

    return () => {
      messageChannel.unsubscribe();
      reactionChannel.unsubscribe();
    };
  }, [channelId, user.id, supabase, addMessageToCache, updateMessageInCache, deleteMessageFromCache, addReactionToCache, removeReactionFromCache, apiUtils]);

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const onUserJoin = useCallback((joiningUserIds: string[]) => {
    setOnlineUsers((prevUsers) => [...prevUsers, ...joiningUserIds]);
  }, []);
  const onUserLeave = useCallback((leavingUserIds: string[]) => {
    setOnlineUsers((prevUsers) =>
      prevUsers.filter((user) => !leavingUserIds.includes(user)),
    );
  }, []);

  
  useEffect(() => {
    console.log('👥 Setting up presence tracking for user:', user.id);
    
    const presenceChannel = supabase
      .channel('global-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        console.log('👥 Presence SYNC event received');
        const currentPresences = presenceChannel.presenceState();
        console.log('👥 Raw presence state:', currentPresences);
        
        const allOnlineUsers: string[] = [];
        for (const [key, presenceArray] of Object.entries(currentPresences)) {
          console.log(`👥 Processing presence key ${key}:`, presenceArray);
          if (Array.isArray(presenceArray)) {
            presenceArray.forEach((presence) => {
              console.log('👥 Individual presence:', presence);
              if (presence && typeof presence === 'object' && 'user_id' in presence) {
                const userId = (presence as { user_id: string }).user_id;
                if (userId && userId !== user.id && !allOnlineUsers.includes(userId)) {
                  allOnlineUsers.push(userId);
                  console.log(`👥 Added user ${userId} to online list`);
                }
              }
            });
          }
        }
        
        console.log('👥 FINAL online users list:', allOnlineUsers);
        setOnlineUsers(allOnlineUsers);
      })
      .on('presence', { event: 'join' }, (payload) => {
        console.log('👥 User JOINED presence - full payload:', payload);
        
        const joiningUserIds: string[] = [];
        if (payload.newPresences) {
          for (const [key, presenceArray] of Object.entries(payload.newPresences)) {
            console.log(`👥 New presence key ${key}:`, presenceArray);
            if (Array.isArray(presenceArray)) {
              presenceArray.forEach((presence) => {
                if (presence && typeof presence === 'object' && 'user_id' in presence) {
                  const userId = (presence as { user_id: string }).user_id;
                  if (userId && userId !== user.id && !joiningUserIds.includes(userId)) {
                    joiningUserIds.push(userId);
                  }
                }
              });
            }
          }
        }
        
        console.log('👥 Users joining:', joiningUserIds);
        if (joiningUserIds.length > 0) {
          onUserJoin(joiningUserIds);
        }
      })
      .on('presence', { event: 'leave' }, (payload) => {
        console.log('👥 User LEFT presence - full payload:', payload);
        
        const leavingUserIds: string[] = [];
        if (payload.leftPresences) {
          for (const [key, presenceArray] of Object.entries(payload.leftPresences)) {
            console.log(`👥 Left presence key ${key}:`, presenceArray);
            if (Array.isArray(presenceArray)) {
              presenceArray.forEach((presence) => {
                if (presence && typeof presence === 'object' && 'user_id' in presence) {
                  const userId = (presence as { user_id: string }).user_id;
                  if (userId && !leavingUserIds.includes(userId)) {
                    leavingUserIds.push(userId);
                  }
                }
              });
            }
          }
        }
        
        console.log('👥 Users leaving:', leavingUserIds);
        if (leavingUserIds.length > 0) {
          onUserLeave(leavingUserIds);
        }
      })
      .subscribe(async (status) => {
        console.log('👥 Presence subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('👥 Tracking presence for user:', user.id);
          const trackResult = await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            user_info: {
              id: user.id,
              email: user.email
            }
          });
          console.log('👥 Track result:', trackResult);
          
          setTimeout(() => {
            console.log('👥 Forcing presence sync...');
            const currentState = presenceChannel.presenceState();
            console.log('👥 Current state after track:', currentState);
          }, 1000);
        }
      });

    return () => {
      console.log('👥 Unsubscribing from presence channel for user:', user.id);
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
    };
  }, [user.id, user.email, supabase, onUserJoin, onUserLeave]);

  // Real-time subscription for profile updates
  useEffect(() => {
    if (!serverId) return;

    const profileChannel = supabase
      .channel(`profiles-${serverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('👤 Profile UPDATE event received:', payload);
          // Invalidate the server members query to refetch with updated profile data
          apiUtils.servers.getServerMembers.invalidate({ serverId });
          // Also invalidate messages query since messages contain embedded author data
          apiUtils.messages.getPaginatedMessages.invalidate({ channelId });
        }
      )
      .subscribe();

    return () => {
      profileChannel.unsubscribe();
    };
  }, [serverId, channelId, supabase, apiUtils]);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    setTypingUsers(prev => prev.filter(userId => onlineUsers.includes(userId)));
  }, [onlineUsers]);

  // Memoizing bc this might be computationally expensive over rerenders
  // Stores the text that should show up for the user when someone is typing based on the
  // number of users who are currently typing. Since this operation may be expensive (looking
  // up user data), it is memoized to prevent it from being recalculated on every render and
  // instead only recalculated when the variables it depends on change.
  const typingText = useMemo(() => {
    if (typingUsers.length === 0) {
      return "";
    }
    if (typingUsers.length === 1) {
      const typingUser = members?.find(
        (member) => member.id === typingUsers[0],
      );
      return `${typingUser?.displayName} is typing...`;
    }
    if (typingUsers.length > 3) {
      return `Several users are typing...`;
    }

    const typingUserNames = typingUsers.map((userId) => {
      const typingUser = members?.find((member) => member.id === userId);
      return typingUser?.displayName;
    });

    return `${typingUserNames.join(", ")} are typing...`;
  }, [typingUsers, members]);

  // Store whether the current user is typing. This is used to determine whether to send a message
  // to the correct Realtime channel that the user is typing.
  const [isTyping, setIsTyping] = useState(false);

  
  useEffect(() => {
const channel = supabase.channel(`channel-${channelId}`);
    channel
    .on("broadcast", 
      {event: 'typingStart'},
    (payload) => {
      const typingUser = payload.payload.message;
      setTypingUsers((prevArray) => {
        if(prevArray.includes(typingUser)) return prevArray;
        return [...prevArray, typingUser];
      });
      });

    channel
    .on("broadcast",
      {event: 'typingEnd'},
      (payload) => {
        const typingUser = payload.payload.message;
        setTypingUsers((prevArray) => prevArray.filter((userId) => userId !== typingUser));
      }
    );

    channel.subscribe();

    if(isTyping){
      channel.send({
        type: 'broadcast',
        event: 'typingStart',
        payload: {message: user.id},
      });
    } else{
      channel.send({
        type: 'broadcast',
        event: 'typingEnd',
        payload: {message: user.id},
      });
    }

    return () => {
      channel.unsubscribe();
    }
  }, [channelId, isTyping, supabase, user]);

  useEffect(() => {
 const channel = supabase.channel('user-change');
    channel
    .on('broadcast',
      {event: 'userStatusChange'},
      () => {
        //Learned about refetch through this documentation: https://tanstack.com/query/v5/docs/framework/react/reference/useQuery
        apiUtils.servers.getServerMembers.refetch({serverId});
      }
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    }
  }, [apiUtils.servers.getServerMembers, serverId, supabase]);

  // Create states to handle the user's draft message text.
  const [draftMessageText, setDraftMessageText] = useState<string>("");

  // Create states to handle selecting and uploading files.
  // The input ref points to the hidden HTML file input element that
  // can be "clicked" to open the file picker.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // The selected file is the file that the user has selected to upload.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // References to the message text area and the end of the message view so that
  // these elements can be referenced directly.
  const messageTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // This effect ensures that the message view scrolls to the bottom only when the first page loads.
  // This is necessary since our message view starts at the bottom, then scrolls upward!
  useEffect(() => {
    // Ensures that the message view scrolls to the bottom only when the first page loads.
    if (messages?.pages.length === 1 || filteredMessages?.pages.length === 1) {
      messageEndRef.current?.scrollIntoView();
    }
  }, [messageEndRef, messages, filteredMessages]);

  // This function handles what should happen whenever a key is pressed down in the message text area.
  // This function is used to handle the enter key press to send messages. Pressing enter when the text
  // area is focused should send the message. Pressing enter with shift should create a new line.
  //
  // Since this function is computationally expensive, it is memoized using `useCallback` to prevent
  // it from being recalculated on every render and instead only recalculated when the variables it
  // depends on change and it is passed as a dependency to the `useEffect` hook.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Set the typing status of the user to true.
      setIsTyping(true);

      // If the user is typing and the message text area is focused and the enter key is pressed
      if (
        document.activeElement === messageTextAreaRef.current &&
        e.key === "Enter" &&
        !e.shiftKey
      ) {
        // Disables the default behavior of the enter key on the text area, preventing
        // the cursor from moving to the new line when sending a message.
        e.preventDefault();
        // Send a message if only it is not blank.
        if (draftMessageText.trim() !== "" || !!selectedFile) {
          // Create a draft message object with the current user's ID and the message text.
          const draftMessage = {
            id: uuidv4(),
            content: draftMessageText,
            authorId: user.id,
            channelId: channelId as string,
            attachmentUrl: null,
            createdAt: new Date(),
          };
          // Optimistically add the message to the cache so that the user can see that the message
          // appears immediately on the screen. If the message fails to send, this will be reverted.
          addMessageToCache(draftMessage);
          // Store the current message text and file in case the message fails to send.
          const pendingMessage = draftMessageText;
          const pendingFile = selectedFile;
          // Clear the message text and selected file, and set the user to not typing.
          setDraftMessageText("");
          setSelectedFile(null);
          setIsTyping(false);

          // Upload image
          const sendMessageHandler = (attachmentUrl: string | null) =>
            sendMessage(
              { ...draftMessage, attachmentUrl },
              {
                onSuccess: (postedMessage) => {
                  updateMessageInCache(postedMessage);
                  messageEndRef.current?.scrollIntoView();
                },
                onError: () => {
                  toast("Message failed to send. Please try again.");
                  deleteMessageFromCache(draftMessage.id);
                  setDraftMessageText(pendingMessage);
                  setSelectedFile(pendingFile);
                  setIsTyping(true);
                },
              },
            );
          if (pendingFile) {
            uploadAttachmentToSupabase(
              supabase,
              draftMessage.id,
              pendingFile,
              (attachmentUrl) => {
                sendMessageHandler(attachmentUrl);
              },
            );
          } else {
            sendMessageHandler(null);
          }
        }
      }
    },
    [
      addMessageToCache,
      channelId,
      deleteMessageFromCache,
      draftMessageText,
      selectedFile,
      sendMessage,
      supabase,
      updateMessageInCache,
      user.id,
    ],
  );

  // This effect listens for key down events on the window and calls the `handleKeyDown` function.
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const onReactionAddForMessage = (messageId: string) => (emoji: string) => {
    const existingReaction = messages?.pages.flatMap((page) =>
      page.flatMap((message) =>
        message.id === messageId
          ? message.reactions.filter(
              (reaction) =>
                reaction.reaction === emoji && reaction.profileId === user.id,
            )
          : [],
      ),
    );

    if (existingReaction && existingReaction.length > 0) {
      onReactionRemoveForMessage(messageId)(emoji);
      return;
    }

    const id = uuidv4();
    addReactionToCache(messageId, {
      id: id,
      reaction: emoji,
      profileId: user.id,
    });
    // Attempt to add the reaction to the message on the server.
    addReactionToMessage(
      { channelId, messageId, emoji },
      {
        onError: () => {
          // If it fails, alert the user and revert the reaction to the previous state.
          removeReactionFromCache(id);
          toast("Failed to add reaction. Please try again.");
        },
      },
    );
  };

  // This function handles what should happen whenever the user removes a reaction from a message.
  const onReactionRemoveForMessage = (messageId: string) => (emoji: string) => {
    // Find the reaction ID of the user's reaction to the message. This is required, unfortunately,
    // because Supabase Realtime DELETE events only send back the message ID and not the entire
    // item that was deleted.
    const idsToRemove = messages?.pages.flatMap((page) =>
      page.flatMap((message) =>
        message.id === messageId
          ? message.reactions
              .filter(
                (reaction) =>
                  reaction.reaction === emoji && reaction.profileId === user.id,
              )
              .map((reaction) => reaction.id)
          : [],
      ),
    );
    // Only delete a reaction if it has been found.
    if (idsToRemove && idsToRemove.length > 0) {
      // Optimistically remove the reaction from the cache so that the user can see the reaction
      // disappear immediately. If the reaction fails to delete, this will be reverted.
      const id = idsToRemove[0];
      removeReactionFromCache(id);
      // Attempt to remove the reaction from the message on the server.
      removeReactionFromMessage(
        { channelId, messageId, emoji },
        {
          onError: () => {
            addReactionToCache(messageId, {
              id: id,
              reaction: emoji,
              profileId: user.id,
            });
            toast("Failed to remove reaction. Please try again.");
          },
        },
      );
    }
  };

  return (
    <div className="flex h-screen max-h-screen w-full flex-col overflow-hidden">
      <ServerHeader
        user={user}
        filterQuery={filterQuery}
        setFilterQuery={setFilterQuery}
        selectedServer={server ?? undefined}
        selectedChannel={channels?.find((c) => c.id === (channelId as string))}
      />
      <div className="flex grow flex-row">
        {/* Channel sidebar */}
        <ServerChannelSidebar
          user={user}
          channels={channels}
          selectedChannelId={!!channelId ? (channelId as string) : undefined}
        />
        <div className="flex max-h-[calc(100vh-56px)] grow flex-col">
          <ScrollArea
            className={cn(
              "flex grow flex-col",
              !!selectedFile
                ? "h-[calc(100vh-286px)]"
                : "h-[calc(100vh-238px)]",
            )}
          >
            {/* Note: The messages appear bottom-to-top because of `flex-col-reverse`.  */}
            <div className="flex grow flex-col-reverse p-3">
              <div ref={messageEndRef}></div>
              {/* If the filter is active, show the filter results. */}
              {isFilterActive &&
                filteredMessages?.pages.map((page) => {
                  return page.map((message, messageIndex) => {
                    return (
                      <Fragment key={message.id}>
                        {messageIndex === 45 && (
                          <InView
                            onChange={(inView, entry) => {
                              if (inView && entry.intersectionRatio > 0) {
                                filteredFetchNext();
                                entry.target.remove();
                              }
                            }}
                          ></InView>
                        )}
                        <MessageView
                          user={user}
                          channelMembers={members ?? []}
                          message={message}
                          onReactionAdd={onReactionAddForMessage(message.id)}
                          onReactionRemove={onReactionRemoveForMessage(
                            message.id,
                          )}
                        />
                      </Fragment>
                    );
                  });
                })}
              {/* If no filter is active, show the regular results. */}
              {!isFilterActive &&
                messages?.pages.map((page) => {
                  return page.map((message, messageIndex) => {
                    return (
                      <Fragment key={message.id}>
                        {messageIndex === 45 && (
                          <InView
                            onChange={(inView, entry) => {
                              if (inView && entry.intersectionRatio > 0) {
                                fetchNext();
                                entry.target.remove();
                              }
                            }}
                          ></InView>
                        )}
                        <MessageView
                          user={user}
                          channelMembers={members ?? []}
                          message={message}
                          onReactionAdd={onReactionAddForMessage(message.id)}
                          onReactionRemove={onReactionRemoveForMessage(
                            message.id,
                          )}
                        />
                      </Fragment>
                    );
                  });
                })}
            </div>
          </ScrollArea>
          {/* Message send area */}
          <div className="flex w-full flex-col border-t px-6 pt-3 pb-6">
            {selectedFile && (
              <div className="flex w-full flex-row gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedFile(null)}
                >
                  <ImageIcon />
                  {selectedFile.name}
                  <X />
                </Button>
              </div>
            )}
            <div className="flex w-full flex-row pt-3">
              <Textarea
                ref={messageTextAreaRef}
                value={draftMessageText}
                onChange={(e) => {
                  setDraftMessageText(e.target.value);
                }}
                onBlur={() => setIsTyping(false)}
                className="bg-sidebar mr-3 grow resize-none"
                placeholder="Type your message here."
              />
              <div className="flex flex-col gap-2">
                {/* 
                  This hidden input provides us the functionality to handle selecting
                  new  pages. This input only accepts images, and when a file is selected,
                  the file is stored in the `selectedFile` state.
                  */}
                <Input
                  className="hidden"
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    setSelectedFile(
                      (e.target.files ?? []).length > 0
                        ? e.target.files![0]
                        : null,
                    );
                    messageTextAreaRef.current?.focus();
                  }}
                />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="icon">
                      <SmilePlus />
                    </Button>
                  </PopoverTrigger>
                  <EmojiPopoverContent
                    onSelect={(emoji) => {
                      setDraftMessageText((old) => old + emoji);
                      messageTextAreaRef.current?.focus();
                    }}
                  />
                </Popover>

                <Button
                  variant="secondary"
                  size="icon"
                  disabled={!!selectedFile}
                  onClick={() => {
                    if (fileInputRef && fileInputRef.current)
                      fileInputRef.current.click();
                  }}
                >
                  <Upload />
                </Button>
              </div>
            </div>
            <p className="h-3 py-2 text-sm italic">{typingText}</p>
          </div>
        </div>

        {/* User sidebar */}
        <ServerUserSidebar
          server={server ?? undefined}
          serverMembers={members ?? []}
          onlineUserIds={onlineUsers}
          userId={user.id}
          className="overflow-visible"
        />
      </div>
    </div>
  );
}

// The `getServerSideProps` function is used to fetch the user data and on
// the server side before rendering the page to both pre-load the Supabase
// user and profile data. If the user is not logged in, we can catch this
// here and redirect the user to the login page.
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Create the supabase context that works specifically on the server and
  // pass in the context.
  const supabase = createSupabaseServerClient(context);

  // Attempt to load the user data
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // If the user is not logged in, redirect them to the login page.
  if (userError || !userData) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Return the user and profile as props.
  return {
    props: {
      user: userData.user,
    },
  };
}