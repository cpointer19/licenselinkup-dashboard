export const dynamic = "force-dynamic";

import { Suspense } from "react";
import {
  fetchAllContacts,
  fetchCampaigns,
  fetchTags,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";
import { OverviewClient } from "./overview-client";
import { Skeleton } from "@/components/ui/skeleton";

async function getOverviewData() {
  const [allContacts, tags, campaigns] = await Promise.all([
    fetchAllContacts(),
    fetchTags(),
    fetchCampaigns(),
  ]);

  // Founding Members count = send_amt of "APPROVED: FOUNDING MEMBER" campaign
  // (email 1 of the Founding Member Approval automation)
  const approvedCampaign = campaigns.find(
    (c) => c.name.trim().toUpperCase() === "APPROVED: FOUNDING MEMBER"
  );
  const foundingMembersSent = Number(approvedCampaign?.send_amt ?? 0);

  // contacts passed to the client are used for the growth chart and recent
  // contacts list only. Exclude test users and pre-2026 contacts so the
  // chart reflects the 2026 launch period.
  const contacts = allContacts.filter((c) => {
    if (isTestUser(c.email)) return false;
    if (c.cdate?.startsWith("2026-03-25")) return false;
    if (c.cdate && c.cdate < "2026-01-01") return false;
    return true;
  });

  return { contacts, tags, foundingMembersSent };
}

export default async function OverviewPage() {
  const data = await getOverviewData();
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <OverviewClient {...data} />
    </Suspense>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
