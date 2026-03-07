export const dynamic = "force-dynamic";

import { Suspense } from "react";
import {
  fetchAllContacts,
  fetchAutomations,
  fetchCampaigns,
  fetchLists,
  fetchTags,
} from "@/lib/activecampaign";
import { OverviewClient } from "./overview-client";
import { Skeleton } from "@/components/ui/skeleton";

async function getOverviewData() {
  const [contacts, automations, campaigns, lists, tags] = await Promise.all([
    fetchAllContacts(),
    fetchAutomations(),
    fetchCampaigns(),
    fetchLists(),
    fetchTags(),
  ]);
  return { contacts, automations, campaigns, lists, tags };
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
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
