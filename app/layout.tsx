import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retro Photo Camera",
  description: "Static retro camera emulator built with Next.js",
  applicationName: "Retro Photo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Retro Photo"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
