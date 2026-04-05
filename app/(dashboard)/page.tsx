export const dynamic = "force-dynamic";

import { Suspense } from "react";
import {
  fetchAllContacts,
  fetchTags,
} from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";
import { OverviewClient } from "./overview-client";
import { Skeleton } from "@/components/ui/skeleton";

async function getOverviewData() {
  const [allContacts, tags] = await Promise.all([
    fetchAllContacts(),
    fetchTags(),
  ]);

  const contacts = allContacts.filter((c) => {
    if (isTestUser(c.email)) return false;
    // Exclude bulk import on 2026-03-25 and any pre-2026 test contacts
    if (c.cdate?.startsWith("2026-03-25")) return false;
    if (c.cdate && c.cdate < "2026-01-01") return false;
    return true;
  });
  return { contacts, tags };
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
