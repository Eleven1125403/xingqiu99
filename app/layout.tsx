import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Constellation Archive",
  description: "A cinematic constellation archive for time and memory.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
