import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { router } from "./router";
import { LanguageProvider } from "./lib/language";
import "./styles.css";
const client = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 20_000 } } });
const root = document.getElementById("root");
if (!root) {
  throw new Error("Application root is missing");
}
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="bottom-right" />
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>,
);
