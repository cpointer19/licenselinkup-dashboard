"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import "leaflet/dist/leaflet.css";
import { X, MapPin, User, Briefcase, Hash, Mail, CheckCircle, FileText } from "lucide-react";
import type { MapContact } from "@/lib/map-contacts";

// Leaflet must be imported dynamically (no SSR) because it uses `window`
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-200 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function MapClient({ contacts }: { contacts: MapContact[] }) {
  const [selected, setSelected] = useState<MapContact | null>(null);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-white/10" style={{ height: "100%" }}>
      <LeafletMap contacts={contacts} onSelect={setSelected} />

      {/* Pin count badge */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 rounded-full bg-[#2E3946]/90 backdrop-blur border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300">
        <MapPin className="h-3.5 w-3.5 text-[#5375FF]" />
        {contacts.length} members mapped
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="absolute inset-y-0 right-0 z-[1001] w-80 bg-[#2E3946] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  selected.role.trim().toLowerCase() === "broker"
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-blue-500/20 text-blue-300"
                }`}>
                  {selected.role.trim()}
                </span>
              </div>
              <h2 className="text-base font-semibold text-white leading-tight">{selected.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{selected.state} · {selected.zip}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-0.5">
            <DetailRow label="Agent License" value={selected.agentsLicense} icon={Hash} />
            <DetailRow label="Brokerage License" value={selected.brokerageLicense} icon={Briefcase} />
            <DetailRow label="License Verified" value={selected.licenseVerified} icon={CheckCircle} />
            <DetailRow label="Email" value={selected.email} icon={Mail} />
            <DetailRow label="Founding Member Status" value={selected.foundingMemberStatus} icon={User} />
            <DetailRow label="Notes" value={selected.notes} icon={FileText} />
          </div>
        </div>
      )}
    </div>
  );
}
