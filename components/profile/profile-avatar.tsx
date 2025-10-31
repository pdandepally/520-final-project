/**
 * Abstraction wrapper around Shadcn's avatar component to handle the properties
 * of the profile avatar for this app.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 *
 * @see https://ui.shadcn.com/docs/components/avatar
 */

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { BotMessageSquare } from "lucide-react";
import { z } from "zod";
import { Profile } from "@/server/models/responses";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";

type ProfileAvatarProps = {
  profile?: z.infer<typeof Profile>;
} & React.ComponentProps<typeof Avatar>;
export default function ProfileAvatar({
  profile,
  ...props
}: ProfileAvatarProps) {
  const supabase = createSupabaseComponentClient();

  return (
    <Avatar {...props}>
      <AvatarImage
        src={
          !!profile?.avatarUrl
            ? supabase.storage.from("avatars").getPublicUrl(profile!.avatarUrl)
                .data.publicUrl
            : undefined
        }
        alt={profile?.username}
      />
      <AvatarFallback>
        <BotMessageSquare className="size-4" />
      </AvatarFallback>
    </Avatar>
  );
}
