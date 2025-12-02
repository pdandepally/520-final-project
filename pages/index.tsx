import { createSupabaseServerClient } from "@/utils/supabase/clients/server-props";
import { GetServerSidePropsContext } from "next";

export default function Home() {
  // This component should never render because getServerSideProps
  // always redirects. This is just a fallback.
  return null;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createSupabaseServerClient(context);
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // If the user is not logged in, redirect them to the login page.
  if (userError || !userData.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Get user profile to check account type
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userData.user.id)
    .single();

  // Redirect based on account type
  const destination = profile?.account_type === "employer" ? "/employer/dashboard" : "/worker/dashboard";

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
}
