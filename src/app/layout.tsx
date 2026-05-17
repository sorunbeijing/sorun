import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { fontJa, fontSans, fontFamilySans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "中文学习软件",
  description: "兴趣定制版中文学习平台",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${fontSans.variable} ${fontJa.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${fontSans.className} min-h-screen antialiased font-sans`}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
