import { fetchAutomationById, fetchAutomationBlocks, fetchContactAutomationsByAutomation, fetchContactById } from "@/lib/activecampaign";
import { AutomationDetailClient } from "./automation-detail-client";

export const dynamic = "force-dynamic";

export default async function AutomationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [automation, blocks, contactAutomations] = await Promise.all([
    fetchAutomationById(id),
    fetchAutomationBlocks(id).catch(() => []),
    fetchContactAutomationsByAutomation(id),
  ]);

  // Enrich first 30 contacts
  const slice = contactAutomations.slice(0, 30);
  const contacts = await Promise.all(
    slice.map(async (ca) => {
      try {
        const contact = await fetchContactById(ca.contact);
        return { ...ca, contactInfo: contact };
      } catch {
        return { ...ca, contactInfo: null };
      }
    })
  );

  return (
    <AutomationDetailClient
      automation={automation}
      blocks={blocks}
      contacts={contacts}
      totalContacts={contactAutomations.length}
    />
  );
}
