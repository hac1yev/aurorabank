import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { ThemeProvider } from "@emotion/react";
import theme from "./theme";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_STALE_TIME } from "./consts.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
