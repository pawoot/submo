import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <Component {...pageProps} />
        <Toaster />
      </CurrencyProvider>
    </ThemeProvider>
  );
}