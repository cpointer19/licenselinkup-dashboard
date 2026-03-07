import { fetchCampaigns } from "@/lib/activecampaign";
import { CampaignsClient } from "./campaigns-client";

export const revalidate = 60;

export default async function CampaignsPage() {
  const campaigns = await fetchCampaigns();
  return <CampaignsClient campaigns={campaigns} />;
}
