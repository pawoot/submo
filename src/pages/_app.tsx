import "@/styles/globals.css";
import Script from 'next/script'
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          {/* Google Analytics 4 */}
<Script
    id="google-analytics-4"
    src="https://www.googletagmanager.com/gtag/js?id=G-RMFC9ZZL82"
    strategy="afterInteractive"
/>
              <Script
                  id="google-analytics-4-inline"
                  strategy="afterInteractive"
                  dangerouslySetInnerHTML={{
                      __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-RMFC9ZZL82');`
                  }}
              />
{/* End Google Analytics 4 */}
<Component {...pageProps} />
          <Toaster />
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}