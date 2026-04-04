import { fetchCampaigns } from "@/lib/activecampaign";
import { CampaignsClient } from "./campaigns-client";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const all = await fetchCampaigns();
  const campaigns = all.filter(
    (c) => !c.name.toLowerCase().includes("lance\u2019s contacts")
  );
  return <CampaignsClient campaigns={campaigns} />;
}
