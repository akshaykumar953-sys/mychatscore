import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyChatScore — AI Chat Analysis",
  description:
    "Analyze conversations instantly using AI. Detect interest level, flirting signals, ghosting risk, and relationship dynamics.",
  verification: {
    google: "wcmzjGH4SKbgivR2EOofD_SAay9xDnsYkq5ZkxjWxaU",
  },

  icons: {
    icon: '/favicon.ico',
  },

};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
