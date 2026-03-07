"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Zap,
  Mail,
  Tag,
  List,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",              label: "Overview",      icon: LayoutDashboard },
  { href: "/contacts",      label: "Contacts",      icon: Users },
  { href: "/automations",   label: "Automations",   icon: Zap },
  { href: "/campaigns",     label: "Campaigns",     icon: Mail },
  { href: "/tags",          label: "Tags",          icon: Tag },
  { href: "/lists",         label: "Lists",         icon: List },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <Image src="/ll-logo.svg" alt="LicenseLinkUp" width={32} height={32} className="rounded-lg" />
        <div>
          <p className="text-sm font-semibold text-slate-900">LicenseLinkUp</p>
          <p className="text-xs text-slate-500">Intelligence Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
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
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn("h-4 w-4 flex-shrink-0", active ? "text-blue-600" : "text-slate-400")}
                  />
                  {label}
                  {active && <ChevronRight className="ml-auto h-3 w-3 text-blue-400" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <p className="text-xs text-slate-400">ActiveCampaign</p>
        <p className="text-xs font-medium text-slate-600">licenselinkup.api-us1.com</p>
      </div>
    </aside>
  );
}
