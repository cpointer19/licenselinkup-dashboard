export const dynamic = "force-dynamic";

import { Suspense } from "react";
import {
  fetchAllContacts,
  fetchAutomations,
  fetchCampaigns,
  fetchLists,
  fetchTags,
  fetchContactIdsByListId,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";
import { OverviewClient } from "./overview-client";
import { Skeleton } from "@/components/ui/skeleton";

const LANCE_LIST_KEYWORDS = ["lance"];

async function getOverviewData() {
  // Fetch lists first to identify Lance's list IDs
  const lists = await fetchLists();
  const lanceLists = lists.filter((l) =>
    LANCE_LIST_KEYWORDS.some((kw) => l.name.toLowerCase().includes(kw))
  );

  // Fetch everything in parallel, including Lance's contact IDs for exclusion
  const [allContacts, lanceIdSets, automations, campaigns, tags] = await Promise.all([
    fetchAllContacts(),
    Promise.all(lanceLists.map((l) => fetchContactIdsByListId(l.id))),
    fetchAutomations(),
    fetchCampaigns(),
    fetchTags(),
  ]);

  const lanceContactIds = new Set(lanceIdSets.flatMap((s) => [...s]));
  const contacts = allContacts.filter(
    (c) => !isTestUser(c.email) && !lanceContactIds.has(c.id)
  );

  // Also filter Lance's lists from the List Distribution chart
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
