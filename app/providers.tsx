"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { hydrateFromStorage } from "@/lib/features/authSlice";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateFromStorage());
  }, []);

  return (
    <ThemeProvider>
      <Provider store={store}>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </Provider>
    </ThemeProvider>
  );
}

