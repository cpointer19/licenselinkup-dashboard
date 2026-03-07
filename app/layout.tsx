import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "LicenseLinkUp | Intelligence Dashboard",
  description: "ActiveCampaign analytics dashboard for LicenseLinkUp",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
