/**
 * Entry point and wrapper for all components in the app.
 *
 * @author Ajay Gandecha <ajay@cs.unc.edu>
 * @author Jade Keegan <jade@cs.unc.edu>
 */

import { ThemeProvider } from "@/components/theme/theme-provider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/router";
import { Toaster } from "sonner";
import { api } from "@/utils/trpc/api";

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // The excludedRoutes array contains routes that should not be added into the global
  // sidebar layout.
  const excludedRoutes = ["/login", "/signup"];

  // If the current route is in the excludedRoutes array, the page is rendered without
  // the global sidebar layout or providers.
  if (excludedRoutes.includes(router.pathname)) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider
        style={
          {
            "--sidebar-width": "240px",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <Component {...pageProps} />
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default api.withTRPC(App);
