/**
 * Home page for the application. This page is the first page that users see
 * when they log in. It displays a welcome message and redirects the user to
 * the first server and channel they have access to, if they exist. Otherwise,
 * it displays a message prompting the user to create or join a server.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { api } from "@/utils/trpc/api";
import { ArrowBigLeftDash } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  // Hook into used depdencies.
  const router = useRouter();

  // Attempt to load the user's servers.
  const { data: servers, isLoading: serversLoading } =
    api.servers.getServers.useQuery();

  // If the servers have been loaded, redirect the user to the first server
  // and channel they have access to if able.
  useEffect(() => {
    if (servers && servers[0]) {
      router.push(`${servers[0].id}/${servers[0].channels[0].id}`);
    }
  }, [router, servers]);

  if (serversLoading) {
    <div>
      <p className="p-6 text-lg font-bold">Loading...</p>
    </div>;
  }

  return (
    <div>
      <p className="p-6 text-lg font-bold">Welcome!</p>
      <div className="flex flex-row gap-3 px-6 pt-2">
        <ArrowBigLeftDash />
        <p className="font-bold">
          Create or join a server on the sidebar here.
        </p>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Create the supabase context that works specifically on the server and
  // pass in the context.
  const supabase = createSupabaseServerClient(context);

  // Attempt to load the user data
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // If the user is not logged in, redirect them to the login page.
  if (userError || !userData) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
