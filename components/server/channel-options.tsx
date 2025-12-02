import { Edit, Settings, Trash } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { z } from "zod";
import { Channel } from "@/server/models/responses";
import { toast } from "sonner";
import { api } from "@/utils/trpc/api";

type ChannelOptionsProps = {
  hovering?: boolean;
  channel: z.infer<typeof Channel>;
  isOnlyChannel?: boolean;
};
export default function ChannelOptions({
  hovering,
  channel,
  isOnlyChannel = false,
}: ChannelOptionsProps) {
  const apiUtils = api.useUtils();

  const { mutate: editChannel } = api.channels.editChannel.useMutation();
  const { mutate: deleteChannel } = api.channels.deleteChannel.useMutation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameText, setRenameText] = useState(channel.name);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  return (
    <DropdownMenu
      open={dropdownOpen}
      onOpenChange={(isOpen) => setDropdownOpen(isOpen)}
    >
      <DropdownMenuTrigger
        asChild
        className={cn(hovering || dropdownOpen ? "visible" : "invisible")}
      >
        <Button variant="ghost" size="icon" className="hover:cursor-pointer">
          <Settings className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* Rename Dialog */}
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
              <DialogTitle>Rename Channel</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-right">
                  Channel Name
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
                  editChannel(
                    { id: channel.id, name: renameText },
                    {
                      onSuccess: () => {
                        toast("Channel renamed.");
                        apiUtils.channels.invalidate();
                        setRenameDialogOpen(false);
                      },
                      onError: () => {
                        toast("Could not rename the channel.");
                      },
                    },
                  );
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DropdownMenuSeparator />
        {/* Delete Dialog */}
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
              disabled={!!isOnlyChannel}
              variant="destructive"
            >
              <Trash />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                Deleting channels are not recoverable.
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
                  deleteChannel(
                    { channelId: channel.id },
                    {
                      onSuccess: () => {
                        toast("Channel deleted.");
                        apiUtils.channels.invalidate();
                        setRenameDialogOpen(false);
                      },
                      onError: () => {
                        toast("Could not delete channel.");
                      },
                    },
                  );
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
