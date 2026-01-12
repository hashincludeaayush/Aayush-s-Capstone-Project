export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import Navbar from "@/components/Navbar";
import "./globals.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk, Nunito } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import ClientOnlyN8nChat from "@/components/ClientOnlyN8nChat";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });
const nunito = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Jynx",
  description: "Track products like never before",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={nunito.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <main className="">
              <Navbar />
              <Suspense>{children}</Suspense>
              <ClientOnlyN8nChat />
            </main>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
