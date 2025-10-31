/**
 * This file contains the method used to broadcast to all connected clients that
 * the current user's status has changed.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * [TODO]
 * This function sends a message to the `user-change` realtime channel to broadcast that
 * the current user's status has changed. This is used throughout the app to notify
 * other clients that the user joined / left a channel or changed their display name /
 * profile image.
 *
 * Your goal is to send a `userStatusChange` event to the `user-change` realtime channel.
 * An empty payload is fine.
 *
 * @param supabase: SupabaseClient - The Supabase client used to send the message.
 */
export const broadcastUserChange = (supabase: SupabaseClient) => {
  // Your implementation here...
};
