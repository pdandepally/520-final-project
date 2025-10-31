/**
 * Shadcn component for the user's profile in the sidebar.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu
 */
import { ChevronsUpDown, Edit, ImageUp, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProfileAvatar from "../profile/profile-avatar";
import { useEffect, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { broadcastUserChange } from "@/utils/supabase/realtime";
import { useRouter } from "next/router";
import { api } from "@/utils/trpc/api";
import { uploadAvatarFileToSupabase } from "@/utils/supabase/storage";
import { Subject } from "@/server/models/auth";

type NavUserProps = { user: Subject };
export function NavUser({ user }: NavUserProps) {
  const apiUtils = api.useUtils();
  const supabase = createSupabaseComponentClient();
  const router = useRouter();
  const { isMobile } = useSidebar();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameText, setRenameText] = useState("");

  const { data: profile } = api.profiles.getProfile.useQuery({
    profileId: user.id,
  });

  const { mutate: changeProfileDisplayName } =
    api.profiles.changeProfileDisplayName.useMutation();
  const { mutate: changeProfileImage } =
    api.profiles.changeProfileImage.useMutation();

  useEffect(() => {
    setRenameText(profile?.displayName ?? "");
  }, [profile]);

  // Create states to handle selecting and uploading files.

  // The input ref points to the hidden HTML file input element that
  // can be "clicked" to open the file picker.
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <ProfileAvatar profile={profile} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {profile?.displayName}
                </span>
                <span className="truncate text-xs">@{profile?.username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <ProfileAvatar />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {profile?.displayName}
                  </span>
                  <span className="truncate text-xs">@{profile?.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
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
                  Change Display Name
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Display Name</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3 py-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name" className="text-right">
                      Display Name
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
                      changeProfileDisplayName(
                        { newDisplayName: renameText },
                        {
                          onSuccess: () => {
                            broadcastUserChange(supabase);
                            toast("Display name changed.");
                            apiUtils.profiles.invalidate();
                            apiUtils.servers.getServerMembers.invalidate();
                            setRenameDialogOpen(false);
                          },
                          onError: () => {
                            toast("Could not change display name.");
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
            {/* Change Server Image */}
            <DropdownMenuItem
              onClick={() => {
                if (fileInputRef && fileInputRef.current)
                  fileInputRef.current.click();
              }}
            >
              <ImageUp />
              Change Profile Image
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  toast("Error logging out.", { description: error.message });
                }
                router.push("/");
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
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
          const file =
            (e.target.files ?? []).length > 0 ? e.target.files![0] : null;
          if (file) {
            uploadAvatarFileToSupabase(supabase, file, (avatarUrl) => {
              changeProfileImage(
                { avatarUrl: avatarUrl },
                {
                  onSuccess: () => {
                    toast("Profile image changed.", {
                      description:
                        "It may take a few minutes for the image to process.",
                    });
                    apiUtils.profiles.invalidate();
                    apiUtils.servers.getServerMembers.invalidate();
                  },
                  onError: () => {
                    toast("Could not change profile image.");
                  },
                },
              );
            });
          }
        }}
      />
    </SidebarMenu>
  );
}
