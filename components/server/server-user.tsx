import { z } from "zod";
import ProfileAvatar from "../profile/profile-avatar";
import { SidebarMenuButton } from "../ui/sidebar";
import { Profile } from "@/server/models/responses";
import { Crown } from "lucide-react";

type ServerUserViewProps = {
  profile: z.infer<typeof Profile>;
  isAdmin?: boolean;
};
export default function ServerUserView({
  profile,
  isAdmin = false,
}: ServerUserViewProps) {
  return (
    <SidebarMenuButton asChild className="h-12 p-3">
      <div className="flex flex-row gap-3 p-2">
        <ProfileAvatar profile={profile} />
        <a className="font-semibold">{profile.displayName}</a>
        {isAdmin && <Crown className="ml-1 text-amber-400" />}
      </div>
    </SidebarMenuButton>
  );
}
