import { fetchAutomations, fetchContactAutomationsByAutomation } from "@/lib/activecampaign";
import { AutomationsClient } from "./automations-client";

export const dynamic = "force-dynamic";

async function getData() {
  const automations = await fetchAutomations();

  const enriched = await Promise.all(
    automations.map(async (auto) => {
      try {
        const contacts = await fetchContactAutomationsByAutomation(auto.id);
        // Deduplicate by contact ID — keep the most recent entry per contact
        const byContact = new Map<string, (typeof contacts)[0]>();
        for (const c of contacts) {
          const existing = byContact.get(c.contact);
          if (!existing || (c.adddate && existing.adddate && c.adddate > existing.adddate)) {
            byContact.set(c.contact, c);
          }
        }
        const unique = Array.from(byContact.values());
        const active   = unique.filter((c) => c.status === "1").length;
        const complete = unique.filter((c) => c.status === "2").length;
        return { ...auto, activeContacts: active, completedContacts: complete, totalContacts: unique.length };
      } catch {
        return { ...auto, activeContacts: 0, completedContacts: 0, totalContacts: 0 };
      }
    })
  );

  return { automations: enriched };
}

export default async function AutomationsPage() {
  const { automations } = await getData();
  return <AutomationsClient automations={automations} />;
}
