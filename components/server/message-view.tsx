/**
 * View that represents an individual message.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { Message, MessageReaction, Profile } from "@/server/models/responses";
import ProfileAvatar from "../profile/profile-avatar";
import ProfilePopover from "../profile/profile-popover";
import { z } from "zod";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger } from "../ui/popover";
import EmojiPopoverContent from "./emoji-popover-content";
import { User } from "@supabase/supabase-js";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { ScrollArea } from "../ui/scroll-area";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";

type MessageViewProps = {
  user: User;
  channelMembers: z.infer<typeof Profile>[];
  message: z.infer<typeof Message>;
  onReactionAdd: (emoji: string) => void;
  onReactionRemove: (emoji: string) => void;
};
export default function MessageView({
  user,
  channelMembers,
  message,
  onReactionAdd,
  onReactionRemove,
}: MessageViewProps) {
  const supabase = createSupabaseComponentClient();
  const [isHovering, setIsHovering] = useState(false);
  const [reactionsPopoverOpen, setReactionsPopoverOpen] = useState(false);

  // Determine the reactions that the user has.
  const userReactions = new Set(
    message.reactions
      .filter((r) => r.profileId === user.id)
      .map((r) => r.reaction),
  );

  // Determine the reactions that only other users have.
  // To prevent this from being computationally expensive on rerender, this
  // can be memoized.
  const otherReactions = new Set(
    message.reactions
      .filter((r) => r.profileId !== user.id && !userReactions.has(r.reaction))
      .map((r) => r.reaction),
  );

  // Group reactions by reaction text.
  // To prevent this from being computationally expensive on rerender, this
  // can be memoized.
  const groupedReactions = useMemo(() => {
    const groups: { [key: string]: z.infer<typeof MessageReaction>[] } = {};
    message.reactions.forEach((reaction) => {
      if (!groups[reaction.reaction]) {
        groups[reaction.reaction] = [];
      }
      groups[reaction.reaction].push(reaction);
    });
    return groups;
  }, [message.reactions]);

  return (
    <div
      className="hover:bg-accent flex w-full flex-row gap-3 rounded-lg p-2"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <ProfileAvatar
        profile={channelMembers.find((m) => m.id === message.author.id)}
      />
      <div className="flex grow flex-col gap-1">
        <div className="flex flex-row items-center gap-2">
          <ProfilePopover profile={message.author} side="top" align="start">
            <p className="font-semibold hover:underline">
              {message.author.displayName}
            </p>
          </ProfilePopover>
          <p className="text-muted-foreground text-sm">
            {message.createdAt &&
              new Date(message.createdAt).toLocaleString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
          </p>
          <div className="ml-auto flex flex-row items-center gap-2">
            <Popover
              open={reactionsPopoverOpen}
              onOpenChange={(isOpen) => setReactionsPopoverOpen(isOpen)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "bg-accent border-sidebar hover:bg-background",
                    isHovering ? "visible" : "invisible",
                  )}
                >
                  <SmilePlus />
                </Button>
              </PopoverTrigger>
              <EmojiPopoverContent
                onSelect={(emoji) => {
                  if (!userReactions.has(emoji)) {
                    onReactionAdd(emoji);
                    setReactionsPopoverOpen(false);
                  }
                }}
              />
            </Popover>
          </div>
        </div>
        {message.attachmentUrl && (
          <Image
            className="my-1 rounded-lg"
            src={
              supabase.storage
                .from("attachments")
                .getPublicUrl(message.attachmentUrl).data.publicUrl
            }
            alt={message.content}
            width={300}
            height={300}
          />
        )}
        <p>{message.content}</p>
        <div className="flex flex-row flex-wrap gap-2">
          {[...userReactions, ...otherReactions].map((reaction) => (
            <HoverCard key={reaction}>
              <HoverCardTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    userReactions.has(reaction)
                      ? "bg-sidebar! hover:bg-sidebar! hover:border-sidebar-foreground!"
                      : "hover:border-sidebar-foreground!",
                  )}
                  onClick={() => {
                    if (userReactions.has(reaction)) {
                      onReactionRemove(reaction);
                    } else {
                      onReactionAdd(reaction);
                    }
                  }}
                >
                  <p>{reaction}</p>
                  <p> {groupedReactions[reaction]?.length || "0"}</p>
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-48">
                <ScrollArea>
                  <div className="flex flex-col gap-3">
                    {groupedReactions[reaction].map((r) => {
                      const profile = channelMembers.find(
                        (m) => m.id === r.profileId,
                      );
                      return (
                        <div
                          key={r.id}
                          className="flex flex-row items-center gap-2"
                        >
                          <ProfileAvatar profile={profile} />
                          <p>{profile?.displayName}</p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </div>
    </div>
  );
}
