import { NextResponse } from "next/server";
import { fetchAutomationBlocks, fetchAutomationById } from "@/lib/activecampaign";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [automation, blocks] = await Promise.all([
      fetchAutomationById(id),
      fetchAutomationBlocks(id),
    ]);
    return NextResponse.json({ automation, blocks });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
