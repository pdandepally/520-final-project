import { cn } from "@/lib/utils";
import { Channel } from "@/server/models/responses";
import { Hash } from "lucide-react";
import { useRouter } from "next/router";
import { z } from "zod";
import ChannelOptions from "./channel-options";
import { useState } from "react";

type ServerChannelSidebarItemProps = {
  channel: z.infer<typeof Channel>;
  isOnlyChannel?: boolean;
  selectedChannelId?: string;
};
export default function ServerChannelSidebarItem({
  channel,
  isOnlyChannel = false,
  selectedChannelId,
}: ServerChannelSidebarItemProps) {
  const router = useRouter();

  const [isHovering, setIsHovering] = useState<boolean>(false);

  return (
    <div
      className={cn(
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-muted-foreground flex flex-row items-center gap-2 px-2 text-base leading-tight whitespace-nowrap hover:rounded-lg",
        channel.id === selectedChannelId || isHovering
          ? "bg-sidebar-accent text-sidebar-accent-foreground rounded-lg"
          : "",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      key={channel.id}
      onClick={() => router.push(`/${router.query.serverId}/${channel.id}`)}
    >
      <Hash className="size-4" /> {channel.name}
      <div className="ml-auto">
        <ChannelOptions
          channel={channel}
          isOnlyChannel={isOnlyChannel}
          hovering={isHovering}
        />
      </div>
    </div>
  );
}
