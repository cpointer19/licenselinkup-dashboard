import Link from "next/link";
import { LayoutDashboard, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MAP_CONTACTS } from "@/lib/map-contacts";
import { fetchTags, fetchAllContacts, fetchAllContactTags } from "@/lib/activecampaign";
import { isTestUser } from "@/lib/utils";
import { MapClient } from "./MapClient";

export const metadata = { title: "Member Map — LicenseLinkUp" };

export const revalidate = 60;

async function getFoundingEmails(): Promise<Set<string>> {
  try {
    const [tags, contacts, contactTags] = await Promise.all([
      fetchTags(),
      fetchAllContacts(),
      fetchAllContactTags(),
    ]);

    const onboardingTag = tags.find((t) => t.tag.toLowerCase() === "onboarding_complete");
    const rejectedTag = tags.find((t) => t.tag.toLowerCase() === "founding_member_rejected");
    if (!onboardingTag) return new Set();

    const rejectedTagId = rejectedTag?.id;

    // Build contact ID → email map (excluding test users)
    const idToEmail = new Map<string, string>();
    for (const c of contacts) {
      if (!isTestUser(c.email)) idToEmail.set(c.id, c.email.toLowerCase());
    }

    // Find contacts rejected
    const rejectedContactIds = new Set<string>();
    if (rejectedTagId) {
      for (const ct of contactTags) {
        if (ct.tag === rejectedTagId) rejectedContactIds.add(ct.contact);
      }
    }

    // Find contacts with onboarding_complete tag (not rejected, not test)
    const foundingEmails = new Set<string>();
    for (const ct of contactTags) {
      if (ct.tag === onboardingTag.id && !rejectedContactIds.has(ct.contact)) {
        const email = idToEmail.get(ct.contact);
        if (email) foundingEmails.add(email);
      }
    }

    return foundingEmails;
  } catch {
    return new Set();
  }
}

export default async function MapPage() {
  const foundingEmails = await getFoundingEmails();

  // Override foundingMemberStatus based on AC data
  const contacts = MAP_CONTACTS.map((c) => ({
    ...c,
    foundingMemberStatus: c.email && foundingEmails.has(c.email.toLowerCase()) ? "Approved" : "",
  }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Member Map"
        description={`${contacts.length} people who have provided a license in their Profile`}
      />
      <Link
        href="/"
        className="flex items-center justify-between rounded-xl border border-[#5375FF]/20 bg-[#5375FF]/5 px-5 py-4 transition-colors hover:bg-[#5375FF]/10 group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5375FF]/10">
            <LayoutDashboard className="h-4.5 w-4.5 text-[#5375FF]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Overview Dashboard</p>
            <p className="text-xs text-slate-500">Back to KPIs, pipeline, and weekly intelligence</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-[#5375FF] flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <MapClient contacts={contacts} />
    </div>
  );
}
