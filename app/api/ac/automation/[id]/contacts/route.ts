import { NextResponse } from "next/server";
import { fetchContactAutomationsByAutomation, fetchContactById } from "@/lib/activecampaign";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contactAutomations = await fetchContactAutomationsByAutomation(id);

    // Enrich with contact info (batch, max 50 to avoid rate limits)
    const slice = contactAutomations.slice(0, 50);
    const enriched = await Promise.all(
      slice.map(async (ca) => {
        try {
          const contact = await fetchContactById(ca.contact);
          return { ...ca, contactInfo: contact };
        } catch {
          return { ...ca, contactInfo: null };
        }
      })
    );

    return NextResponse.json({ contacts: enriched, total: contactAutomations.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
