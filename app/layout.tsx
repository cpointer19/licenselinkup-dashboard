import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
