/**
 * Sidebar for the entire app showing all servers that the user is in.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 * @see https://ui.shadcn.com/docs/components/sidebar
 */

import { BotMessageSquare, DoorOpen, Plus } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { Avatar } from "../ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { DialogDescription } from "@radix-ui/react-dialog";
import { broadcastUserChange } from "@/utils/supabase/realtime";
import { api } from "@/utils/trpc/api";

type AppSidebarProps = React.ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: AppSidebarProps) {
  const apiUtils = api.useUtils();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseComponentClient();

  const { data: servers } = api.servers.getServers.useQuery();

  const selectedServerId =
    pathname.split("/").length > 1 ? pathname.split("/")[1] : "";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [joinServerDialogOpen, setJoinServerDialogOpen] = useState(false);
  const [joinServerText, setJoinServerText] = useState("");
  const [newServerDialogOpen, setNewServerDialogOpen] = useState(false);
  const [newServerText, setNewServerText] = useState("");

  const { mutate: createServer } = api.servers.createServer.useMutation();
  const { mutate: joinServer } = api.servers.joinServer.useMutation();

  return (
    <Sidebar
      collapsible="none"
      className="h-screen w-[calc(var(--sidebar-width-icon)+1px)]! overflow-hidden border-r *:data-[sidebar=sidebar]:flex-col"
      {...props}
    >
      <ScrollArea className="h-[calc(100vh)]">
        <SidebarHeader className="flex h-[55px] w-full flex-row items-center justify-center">
          <BotMessageSquare className="size-8" />
        </SidebarHeader>
        <Separator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 py-2 md:px-0">
              <SidebarMenu>
                {servers &&
                  servers.map((server) => (
                    <SidebarMenuItem
                      key={server.id}
                      onClick={() =>
                        router.push(`/${server.id}/${server.channels[0].id}`)
                      }
                    >
                      {selectedServerId === server.id && (
                        <div className="bg-foreground absolute left-[-8px] mt-2 h-8 w-[3px] rounded"></div>
                      )}
                      <SidebarMenuButton
                        size="lg"
                        asChild
                        className="bg-sidebar-accent md:h-12 md:p-0"
                      >
                        <Avatar className="size-12 rounded-full hover:cursor-pointer hover:rounded-xl">
                          <AvatarImage
                            src={
                              !!server.serverImageUrl
                                ? supabase.storage
                                    .from("server_images")
                                    .getPublicUrl(server.serverImageUrl).data
                                    .publicUrl
                                : undefined
                            }
                            alt={server.name}
                          />
                          <AvatarFallback className="flex w-full flex-row justify-center">
                            <p className="w-full text-center">
                              {server.name.slice(0, 2).toUpperCase()}
                            </p>
                          </AvatarFallback>
                        </Avatar>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                <SidebarMenuItem>
                  <DropdownMenu
                    open={dropdownOpen}
                    onOpenChange={(isOpen) => setDropdownOpen(isOpen)}
                  >
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        asChild
                        className="md:h-12 md:p-0"
                        onClick={() => setNewServerDialogOpen(true)}
                      >
                        <a href="#">
                          <div className="bg-sidebar-accent flex aspect-square size-12 items-center justify-center rounded-full">
                            <Plus className="text-foreground size-6" />
                          </div>
                        </a>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                      side="right"
                      align="start"
                      sideOffset={4}
                    >
                      {/* Join Server Dialog */}
                      <Dialog
                        open={joinServerDialogOpen}
                        onOpenChange={(isOpen) =>
                          setJoinServerDialogOpen(isOpen)
                        }
                      >
                        <DialogTrigger asChild>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              setJoinServerDialogOpen(true);
                            }}
                          >
                            <DoorOpen />
                            Join Server
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Join Server</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm">
                              Paste in the ID of the server that you want to
                              join below. Ask a friend for this code if you do
                              not have it!
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col gap-3 py-3">
                            <div className="flex w-full flex-col items-center gap-2">
                              <Input
                                id="name"
                                placeholder="Server ID here..."
                                value={joinServerText}
                                onChange={(e) =>
                                  setJoinServerText(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              disabled={joinServerText.length < 1}
                              type="submit"
                              onClick={() => {
                                joinServer(
                                  { serverId: joinServerText },
                                  {
                                    onSuccess: (server) => {
                                      broadcastUserChange(supabase);
                                      toast("Server joined.");
                                      apiUtils.servers.invalidate();
                                      setJoinServerDialogOpen(false);
                                      setDropdownOpen(false);
                                      router.push(
                                        `/${server.id}/${server.channels[0].id}`,
                                      );
                                    },
                                    onError: () => {
                                      toast(
                                        "Error: Invalid server code. Please try again.",
                                      );
                                    },
                                  },
                                );
                              }}
                            >
                              Join
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <DropdownMenuSeparator />
                      {/* Create Server Dialog */}
                      <Dialog
                        open={newServerDialogOpen}
                        onOpenChange={(isOpen) =>
                          setNewServerDialogOpen(isOpen)
                        }
                      >
                        <DialogTrigger asChild>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              setNewServerDialogOpen(true);
                            }}
                          >
                            <Plus />
                            Create Server
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>New Server</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col gap-3 py-3">
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="name" className="text-right">
                                Server Name
                              </Label>
                              <Input
                                id="name"
                                value={newServerText}
                                onChange={(e) =>
                                  setNewServerText(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              disabled={newServerText.length < 1}
                              type="submit"
                              onClick={async () => {
                                createServer(
                                  { serverName: newServerText },
                                  {
                                    onSuccess: (server) => {
                                      toast("Server created.");
                                      apiUtils.servers.invalidate();
                                      setNewServerDialogOpen(false);
                                      setDropdownOpen(false);
                                      router.push(
                                        `/${server.id}/${server.channels[0].id}`,
                                      );
                                    },
                                  },
                                );
                              }}
                            >
                              Create
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}
