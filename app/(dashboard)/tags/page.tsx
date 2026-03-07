import { fetchTags } from "@/lib/activecampaign";
import { TagsClient } from "./tags-client";

export const revalidate = 60;

export default async function TagsPage() {
  const tags = await fetchTags();
  return <TagsClient tags={tags} />;
}
