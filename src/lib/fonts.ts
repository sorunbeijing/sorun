import { Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";

/** 简体中文 */
export const fontSans = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

/** 日文假名・汉字（学习页「意味」等） */
export const fontJa = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ja",
  preload: true,
});

export const fontFamilySans = [
  "var(--font-sans)",
  "var(--font-ja)",
  "Hiragino Sans",
  "Yu Gothic UI",
  "Yu Gothic",
  "Meiryo",
  "MS PGothic",
  "Noto Sans CJK SC",
  "PingFang SC",
  "Microsoft YaHei",
  "sans-serif",
].join(", ");
