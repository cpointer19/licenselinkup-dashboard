import { fetchLists } from "@/lib/activecampaign";
import { ListsClient } from "./lists-client";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const lists = await fetchLists();
  return <ListsClient lists={lists} />;
}
