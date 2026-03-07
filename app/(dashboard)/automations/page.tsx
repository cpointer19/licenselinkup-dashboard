import { fetchAutomations, fetchContactAutomationsByAutomation } from "@/lib/activecampaign";
import { AutomationsClient } from "./automations-client";

export const dynamic = "force-dynamic";

const HIDDEN_AUTOMATIONS = new Set([
  "Landing Page sign up Welcome email",
  "Founding Application Received",
  "Send Peer Review Emails (Applicant Notification)",
  "#3 - New Signup",
  "EMAIL 2 — New Funnel Entry Email",
  "email 1 to peer",
  "EMAIL 4 — Founding Member Peer Review Request",
  "Outreach to Founding Member's Peers for Review",
  "Automation 9",
  "# 4 — FM PR Request",
  "Automation for form Peer Review – Member Feedback",
  "#5 - FM Peer Outreach",
  "Founder Drip Email Series",
]);

async function getData() {
  const allAutomations = await fetchAutomations();
  const automations = allAutomations.filter((a) => !HIDDEN_AUTOMATIONS.has(a.name));

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
