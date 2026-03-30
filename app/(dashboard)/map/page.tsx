import Link from "next/link";
import { LayoutDashboard, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MAP_CONTACTS } from "@/lib/map-contacts";
import { MapClient } from "./MapClient";

export const metadata = { title: "Member Map — LicenseLinkUp" };

export default function MapPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Member Map"
        description={`${MAP_CONTACTS.length} people who have provided a license in their Profile`}
      />
      <Link
        href="/"
        className="flex items-center justify-between rounded-xl border border-[#5375FF]/20 bg-[#5375FF]/5 px-5 py-4 transition-colors hover:bg-[#5375FF]/10 group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5375FF]/10">
            <LayoutDashboard className="h-4.5 w-4.5 text-[#5375FF]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Overview Dashboard</p>
            <p className="text-xs text-slate-500">Back to KPIs, pipeline, and weekly intelligence</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-[#5375FF] flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <MapClient contacts={MAP_CONTACTS} />
    </div>
  );
}
