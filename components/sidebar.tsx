"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Zap,
  Mail,
  ChevronRight,
  LogOut,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",              label: "Overview",            icon: LayoutDashboard },
  { href: "/meta-ads",      label: "Meta Ad Performance", icon: BarChart2 },
  { href: "/contacts",      label: "Contacts",            icon: Users },
  { href: "/automations",   label: "Automations",         icon: Zap },
  { href: "/campaigns",     label: "Campaigns",           icon: Mail },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-[#3A4553] bg-[#2E3946]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <Image src="/ll-logo.svg" alt="LicenseLinkUp" width={32} height={32} className="rounded-lg" />
        <div>
          <p className="text-sm font-semibold text-white">LicenseLinkUp</p>
          <p className="text-xs text-slate-400">Intelligence Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Analytics
        </p>
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 flex-shrink-0", active ? "text-white" : "text-slate-500")}
                  />
                  {label}
                  {active && <ChevronRight className="ml-auto h-3 w-3 text-slate-400" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div>
          <p className="text-xs text-slate-500">ActiveCampaign</p>
          <p className="text-xs font-medium text-slate-300">licenselinkup.api-us1.com</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
