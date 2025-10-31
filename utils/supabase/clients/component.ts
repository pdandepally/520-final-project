/**
 * This file defines the Supabase client that is used on
 * the *client side* of the application (for example,
 * from within React components and pages).
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseComponentClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  return supabase;
}
