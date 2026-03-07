import { fetchCampaigns } from "@/lib/activecampaign";
import { CampaignsClient } from "./campaigns-client";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await fetchCampaigns();
  return <CampaignsClient campaigns={campaigns} />;
}
