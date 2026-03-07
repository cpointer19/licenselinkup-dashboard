import { NextResponse } from "next/server";
import { fetchAutomations, fetchContactAutomationsByAutomation } from "@/lib/activecampaign";

export async function GET() {
  try {
    const automations = await fetchAutomations();

    // Fetch contact counts for each automation in parallel (batched)
    const enriched = await Promise.all(
      automations.map(async (auto) => {
        try {
          const contacts = await fetchContactAutomationsByAutomation(auto.id);
          const active   = contacts.filter((c) => c.status === "1").length;
          const complete = contacts.filter((c) => c.status === "2").length;
          return { ...auto, activeContacts: active, completedContacts: complete, totalContacts: contacts.length };
        } catch {
          return { ...auto, activeContacts: 0, completedContacts: 0, totalContacts: 0 };
        }
      })
    );

    return NextResponse.json({ automations: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
