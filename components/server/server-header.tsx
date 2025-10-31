/**
 * Header to show on each server page.
 *
 * @author Ajay Gandecha <ajay@class.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import {
  ChevronDown,
  Copy,
  DoorClosed,
  Edit,
  Hash,
  ImageUp,
  Plus,
  Quote,
  Search,
  Sparkle,
  Sparkles,
  Trash,
  UsersRound,
} from "lucide-react";
import { Input } from "../ui/input";
import { z } from "zod";
import { Server, Channel } from "@/server/models/responses";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useRouter } from "next/router";
import { User } from "@supabase/supabase-js";
import { broadcastUserChange } from "@/utils/supabase/realtime";
import { api } from "@/utils/trpc/api";
import { uploadServerImageToSupabase } from "@/utils/supabase/storage";
import ChannelSummary from "./channel-summary";

type ServerHeaderProps = {
  user: User;
  selectedServer?: z.infer<typeof Server>;
  selectedChannel?: z.infer<typeof Channel>;
  filterQuery: string;
  setFilterQuery: (query: string) => void;
};
export default function ServerHeader({
  user,
  selectedServer,
  selectedChannel,
  filterQuery,
  setFilterQuery,
}: ServerHeaderProps) {
  const apiUtils = api.useUtils();
  const supabase = createSupabaseComponentClient();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aiOptionsOpen, setAiOptionsOpen] = useState(false);
  const [aiSummaryDialogOpen, setAiSummaryDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameText, setRenameText] = useState(selectedServer?.name ?? "");
  const [newChannelDialogOpen, setNewChannelDialogOpen] = useState(false);
  const [newChannelText, setNewChannelText] = useState("");
  const [leaveAlertOpen, setLeaveAlertOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const { mutate: changeServerImage } =
    api.servers.changeServerImage.useMutation();
  const { mutate: deleteServer } = api.servers.deleteServer.useMutation();
  const { mutate: leaveServer } = api.servers.leaveServer.useMutation();
  const { mutate: editServer } = api.servers.editServer.useMutation();
  const { mutate: createChannel } = api.channels.createChannel.useMutation();

  // Create states to handle selecting and uploading files.

  // The input ref points to the hidden HTML file input element that
  // can be "clicked" to open the file picker.
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isServerAdmin = selectedServer?.serverCreatorId === user.id;
  return (
    <header className="bg-sidebar z-50 flex h-14 shrink-0 flex-row items-center gap-2 border-b">
      <DropdownMenu
        open={dropdownOpen}
        onOpenChange={(isOpen) => setDropdownOpen(isOpen)}
      >
        <DropdownMenuTrigger
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          asChild
        >
          <div className="flex h-full w-[240px] flex-row items-center justify-between border-r p-3">
            <div className="flex h-full flex-row items-center gap-2">
              <UsersRound className="text-muted-foreground size-5" />
              <p className="font-bold">{selectedServer?.name ?? ""}</p>
            </div>
            <ChevronDown className="size-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          side="bottom"
          align="end"
          sideOffset={4}
        >
          {/* Rename Dialog */}
          {isServerAdmin && (
            <Dialog
              open={renameDialogOpen}
              onOpenChange={(isOpen) => setRenameDialogOpen(isOpen)}
            >
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setRenameDialogOpen(true);
                  }}
                >
                  <Edit />
                  Rename
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename Server</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name" className="text-right">
                      Server Name
                    </Label>
                    <Input
                      id="name"
                      value={renameText}
                      onChange={(e) => setRenameText(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    disabled={renameText.length < 1}
                    type="submit"
                    onClick={async () => {
                      if (selectedServer) {
                        editServer(
                          {
                            id: selectedServer.id,
                            name: renameText,
                            serverImageUrl: selectedServer.serverImageUrl,
                          },
                          {
                            onSuccess: () => {
                              toast("Server renamed.");
                              apiUtils.servers.invalidate();
                              apiUtils.servers.getServer.invalidate();
                              setRenameDialogOpen(false);
                              setDropdownOpen(false);
                            },
                            onError: () => {
                              toast("Could not rename server.");
                            },
                          },
                        );
                      }
                    }}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Change Server Image */}
          {isServerAdmin && (
            <DropdownMenuItem
              onClick={() => {
                if (fileInputRef && fileInputRef.current)
                  fileInputRef.current.click();
              }}
            >
              <ImageUp />
              Change Server Image
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          {/* Copy Join Code */}
          <DropdownMenuItem
            onClick={async () => {
              await navigator.clipboard.writeText(selectedServer?.id ?? "");
              toast("Join code copied to clipboard.");
            }}
          >
            <Copy />
            Copy Join Code
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* New Channel Dialog */}
          <Dialog
            open={newChannelDialogOpen}
            onOpenChange={(isOpen) => setNewChannelDialogOpen(isOpen)}
          >
            <DialogTrigger asChild>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setNewChannelDialogOpen(true);
                }}
              >
                <Plus />
                New Channel
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Channel</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-right">
                    Channel Name
                  </Label>
                  <Input
                    id="name"
                    value={newChannelText}
                    onChange={(e) => setNewChannelText(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={newChannelText.length < 1}
                  type="submit"
                  onClick={async () => {
                    if (selectedServer) {
                      createChannel(
                        {
                          serverId: selectedServer.id,
                          channelName: newChannelText,
                        },
                        {
                          onSuccess: () => {
                            toast("Channel created.");
                            apiUtils.servers.getServer.invalidate({
                              serverId: selectedServer.id,
                            });
                            apiUtils.channels.getChannels.invalidate();
                            setNewChannelDialogOpen(false);
                            setDropdownOpen(false);
                          },
                          onError: () => {
                            toast("Could not create channel.");
                          },
                        },
                      );
                    }
                  }}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator />
          {/* Leave Dialog */}
          <AlertDialog
            open={leaveAlertOpen}
            onOpenChange={(isOpen) => setLeaveAlertOpen(isOpen)}
          >
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setLeaveAlertOpen(true);
                }}
                variant="destructive"
              >
                <DoorClosed />
                Leave Server
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={async () => {
                    setLeaveAlertOpen(false);
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (selectedServer) {
                      leaveServer(
                        { serverId: selectedServer.id },
                        {
                          onSuccess: async () => {
                            broadcastUserChange(supabase);
                            toast("Left server.");
                            apiUtils.servers.invalidate();
                            setLeaveAlertOpen(false);
                            setDropdownOpen(false);
                            await router.push("/");
                          },
                          onError: () => {
                            toast("Could not leave server.");
                          },
                        },
                      );
                    }
                  }}
                >
                  Leave
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {/* Delete Dialog */}
          {isServerAdmin && (
            <AlertDialog
              open={deleteAlertOpen}
              onOpenChange={(isOpen) => setDeleteAlertOpen(isOpen)}
            >
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteAlertOpen(true);
                  }}
                  variant="destructive"
                >
                  <Trash />
                  Delete Server
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deleted servers are not recoverable.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={async () => {
                      setDeleteAlertOpen(false);
                    }}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (selectedServer) {
                        deleteServer(
                          { serverId: selectedServer.id },
                          {
                            onSuccess: async () => {
                              toast("Server deleted.");
                              apiUtils.servers.invalidate();
                              setDeleteAlertOpen(false);
                              setDropdownOpen(false);
                              await router.push("/");
                            },
                            onError: () => {
                              toast("Could not delete server.");
                            },
                          },
                        );
                      }
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* 
        This hidden input provides us the functionality to handle selecting
        new images. This input only accepts images, and when a file is selected,
        the file is stored in the `selectedFile` state.
        */}
      <Input
        className="hidden"
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={async (e) => {
          if (selectedServer) {
            const file =
              (e.target.files ?? []).length > 0 ? e.target.files![0] : null;
            if (file) {
              uploadServerImageToSupabase(supabase, file, (imageUrl) => {
                changeServerImage(
                  {
                    serverId: selectedServer.id,
                    imageUrl: imageUrl,
                  },
                  {
                    onSuccess: () => {
                      toast("Server image changed.", {
                        description:
                          "It may take a few minutes for the image to process.",
                      });
                      apiUtils.servers.invalidate();
                    },
                    onError: () => {
                      toast("Could not update server image.");
                    },
                  },
                );
              });
            }
          }
        }}
      />
      <div className="flex h-full grow flex-row items-center justify-between border-r p-3">
        <div className="flex h-full flex-row items-center gap-2">
          <Hash className="text-muted-foreground size-5" />
          <p className="pt-1 font-bold">{selectedChannel?.name ?? ""}</p>
        </div>
        <div className="flex h-full flex-row items-center gap-2">
          <DropdownMenu
            open={aiOptionsOpen}
            onOpenChange={(isOpen) => setAiOptionsOpen(isOpen)}
          >
            <DropdownMenuTrigger
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              asChild
            >
              <Button className="group" variant={"ghost"}>
                <Sparkle className="group-hover:hidden" />
                <Sparkles className="hidden group-hover:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-48 rounded-lg"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              {selectedChannel?.id && (
                <ChannelSummary
                  open={aiSummaryDialogOpen}
                  setOpen={setAiSummaryDialogOpen}
                  channelId={selectedChannel.id}
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setAiSummaryDialogOpen(true);
                    }}
                  >
                    <Quote />
                    Summarize Channel
                  </DropdownMenuItem>
                </ChannelSummary>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative grow">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search channel..."
              className="bg-background h-9 pl-8"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
