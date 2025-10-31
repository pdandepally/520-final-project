/**
 * Popover that displays profile information. The trigger for the popover
 * is passed into this component as children. For example:
 *
 * ```tsx
 * <ProfilePopover>
 *   <p>Item to open the popover</p>
 * </ProfilePopover>
 * ```
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import ProfileAvatar from "./profile-avatar";
import { Profile } from "@/server/models/responses";

type ProfilePopoverProps = {
  profile?: z.infer<typeof Profile>;
  side?: "top" | "right" | "bottom" | "left" | undefined;
  align?: "start" | "center" | "end" | undefined;
  triggerFullWidth?: boolean;
  children: React.ReactNode;
};

export default function ProfilePopover({
  profile,
  side,
  align,
  triggerFullWidth,
  children,
  ...props
}: ProfilePopoverProps & React.HTMLProps<typeof HTMLDivElement>) {
  return (
    <Popover {...props}>
      <PopoverTrigger className={triggerFullWidth ? `w-full` : ""}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="bg-sidebar"
        side={side}
        sideOffset={12}
        align={align}
      >
        <div className="flex w-full flex-col">
          <ProfileAvatar profile={profile} className="size-16" />
          <div className="mt-4 flex w-full flex-col">
            <p className="text-lg font-bold">{profile?.displayName}</p>
            <p className="text-muted-foreground">@{profile?.username}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
