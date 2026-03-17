import { PageHeader } from "@/components/page-header";
import { MAP_CONTACTS } from "@/lib/map-contacts";
import { MapClient } from "./MapClient";

export const metadata = { title: "Member Map — LicenseLinkUp" };

export default function MapPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Member Map"
        description={`${MAP_CONTACTS.length} contacts · click a pin to view details`}
      />
      <div style={{ height: "calc(100vh - 11rem)" }}>
        <MapClient contacts={MAP_CONTACTS} />
      </div>
    </div>
  );
}
