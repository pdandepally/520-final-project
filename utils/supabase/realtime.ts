import { SupabaseClient } from "@supabase/supabase-js";

export const broadcastUserChange = (supabase: SupabaseClient) => {
  const channel = supabase.channel("user-change");

  channel.send({
    type: "broadcast",
    event: "userStatusChange",
    payload: {},
  });
};
