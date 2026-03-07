import { NextResponse } from "next/server";
import { fetchTags } from "@/lib/activecampaign";

export async function GET() {
  try {
    const tags = await fetchTags();
    return NextResponse.json({ tags });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
