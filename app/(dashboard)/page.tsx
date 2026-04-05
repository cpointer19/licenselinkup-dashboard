export const dynamic = "force-dynamic";

import { Suspense } from "react";
import {
  fetchAllContacts,
  fetchAutomations,
  fetchCampaigns,
  fetchLists,
  fetchTags,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";
import { OverviewClient } from "./overview-client";
import { Skeleton } from "@/components/ui/skeleton";

const LANCE_LIST_KEYWORDS = ["lance"];

async function getOverviewData() {
  const [allContacts, lists, automations, campaigns, tags] = await Promise.all([
    fetchAllContacts(),
    fetchLists(),
    fetchAutomations(),
    fetchCampaigns(),
    fetchTags(),
  ]);

  const contacts = allContacts.filter((c) => !isTestUser(c.email));
  const filteredLists = lists.filter((l) =>
    !LANCE_LIST_KEYWORDS.some((kw) => l.name.toLowerCase().includes(kw))
  );

  return { contacts, automations, campaigns, lists: filteredLists, tags };
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
