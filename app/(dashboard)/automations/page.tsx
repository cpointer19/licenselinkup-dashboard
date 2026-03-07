import { fetchAutomations, fetchContactAutomationsByAutomation } from "@/lib/activecampaign";
import { AutomationsClient } from "./automations-client";

export const revalidate = 60;

async function getData() {
  const automations = await fetchAutomations();

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

  return { automations: enriched };
}

export default async function AutomationsPage() {
  const { automations } = await getData();
  return <AutomationsClient automations={automations} />;
}
