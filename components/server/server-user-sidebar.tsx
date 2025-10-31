/**
 * Sidebar that is used on the right-hand side of servers to show the users
 * in the server that are online and offline.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import ServerUserView from "./server-user";
import ProfilePopover from "../profile/profile-popover";
import { ScrollArea } from "../ui/scroll-area";
import { z } from "zod";
import { Profile, Server } from "@/server/models/responses";

type ServerUserSidebarProps = {
  server?: z.infer<typeof Server>;
  serverMembers: z.infer<typeof Profile>[];
  onlineUserIds: string[];
  userId: string;
} & React.ComponentProps<typeof Sidebar>;

export function ServerUserSidebar({
  server,
  serverMembers,
  onlineUserIds,
  userId,
  ...props
}: ServerUserSidebarProps) {
  const onlineUsers = serverMembers.filter(
    (member) => userId === member.id || onlineUserIds.includes(member.id),
  );

  const offlineUsers = serverMembers.filter(
    (member) => !(userId === member.id) && !onlineUserIds.includes(member.id),
  );

  return (
    <Sidebar
      side="right"
      collapsible="none"
      className="max-w-[240px] min-w-[240px]"
      {...props}
    >
      <ScrollArea className="h-[calc(100vh-56px)] max-w-[240px] min-w-[240px]">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="font-semibold">
              ONLINE - {onlineUsers.length}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {onlineUsers.map((user) => (
                  <SidebarMenuItem key={user.id}>
                    <ProfilePopover
                      profile={user}
                      className="w-full"
                      side="left"
                      align="start"
                      triggerFullWidth
                    >
                      <ServerUserView
                        profile={user}
                        isAdmin={server?.serverCreatorId === user.id}
                      />
                    </ProfilePopover>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="text-muted-foreground">
            <SidebarGroupLabel className="font-semibold">
              OFFLINE - {offlineUsers.length}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {offlineUsers.map((user) => (
                  <SidebarMenuItem key={user.id}>
                    <ProfilePopover
                      profile={user}
                      className="w-full"
                      side="left"
                      align="start"
                      triggerFullWidth
                    >
                      <ServerUserView
                        profile={user}
                        isAdmin={server?.serverCreatorId === user.id}
                      />
                    </ProfilePopover>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}
