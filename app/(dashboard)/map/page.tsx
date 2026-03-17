import { PageHeader } from "@/components/page-header";
import { MAP_CONTACTS } from "@/lib/map-contacts";
import { MapClient } from "./MapClient";

export const metadata = { title: "Member Map — LicenseLinkUp" };

export default function MapPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <PageHeader
        title="Member Map"
        description={`${MAP_CONTACTS.length} members · click a pin to view details`}
      />
      <div className="flex-1 min-h-0" style={{ height: "calc(100vh - 9rem)" }}>
        <MapClient contacts={MAP_CONTACTS} />
      </div>
    </div>
  );
}
