import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { NavUser } from "../sidebar/nav-user";
import { ScrollArea } from "../ui/scroll-area";
import { z } from "zod";
import { Channel } from "@/server/models/responses";
import { Separator } from "../ui/separator";
import ServerChannelSidebarItem from "./server-channel-sidebar-item";
import { Fragment } from "react";
import { User } from "@supabase/supabase-js";

type ServerChannelSidebarProps = {
  user: User;
  channels?: z.infer<typeof Channel>[];
  selectedChannelId?: string;
} & React.ComponentProps<typeof Sidebar>;

export function ServerChannelSidebar({
  user,
  channels,
  selectedChannelId,
  ...props
}: ServerChannelSidebarProps) {
  return (
    <Sidebar
      collapsible="none"
      className="hidden max-w-[240px] min-w-[240px] flex-1 md:flex"
      {...props}
    >
      <ScrollArea className="h-[calc(100vh-120px)]">
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupLabel className="font-semibold">
              TEXT CHANNELS
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {channels?.map((channel) => (
                <Fragment key={channel.id}>
                  <ServerChannelSidebarItem
                    channel={channel}
                    isOnlyChannel={channels.length === 1}
                    selectedChannelId={selectedChannelId}
                  />
                </Fragment>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>
      <Separator />
      <SidebarFooter className="bottom-0">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
