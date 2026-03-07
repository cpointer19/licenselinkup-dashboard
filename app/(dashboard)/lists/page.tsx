import { fetchLists } from "@/lib/activecampaign";
import { ListsClient } from "./lists-client";

export const revalidate = 60;

export default async function ListsPage() {
  const lists = await fetchLists();
  return <ListsClient lists={lists} />;
}
