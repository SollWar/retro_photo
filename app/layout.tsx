import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retro Photo Camera",
  description: "Static retro camera emulator built with Next.js"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
