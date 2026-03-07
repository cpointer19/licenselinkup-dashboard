import { NextResponse } from "next/server";
import { fetchCampaigns } from "@/lib/activecampaign";

export async function GET() {
  try {
    const campaigns = await fetchCampaigns();
    return NextResponse.json({ campaigns });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
