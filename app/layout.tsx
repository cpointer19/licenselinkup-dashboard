import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LicenseLinkUp | Intelligence Dashboard",
  description: "ActiveCampaign analytics dashboard for LicenseLinkUp",
  icons: {
    icon: "/ll-logo-icon.svg",
    apple: "/ll-logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-[#FAFAF8] antialiased">
        {children}
      </body>
    </html>
  );
}
