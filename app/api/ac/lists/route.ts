import { NextResponse } from "next/server";
import { fetchLists } from "@/lib/activecampaign";

export async function GET() {
  try {
    const lists = await fetchLists();
    return NextResponse.json({ lists });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
