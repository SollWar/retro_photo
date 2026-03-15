import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retro Photo Camera",
  description: "Static retro camera emulator built with Next.js",
  applicationName: "Retro Photo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Retro Photo"
  },
  formatDetection: {
    telephone: false
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
      <head>
        <link rel="manifest" href="./manifest.webmanifest" />
        <link rel="icon" href="./favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="./icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="./icon-512.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="./apple-touch-icon.png" sizes="180x180" />
      </head>
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
