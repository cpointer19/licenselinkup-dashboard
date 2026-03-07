import { fetchTags } from "@/lib/activecampaign";
import { TagsClient } from "./tags-client";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await fetchTags();
  return <TagsClient tags={tags} />;
}
