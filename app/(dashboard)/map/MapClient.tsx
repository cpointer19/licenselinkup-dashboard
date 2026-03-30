"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { X, MapPin, User, Briefcase, Hash, Mail, CheckCircle, FileText, Clock, Shield, Download, ChevronRight } from "lucide-react";
import type { MapContact } from "@/lib/map-contacts";

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

// ─── Founding Member Tables ──────────────────────────────────────────────────

function LocationTable({ contacts }: { contacts: MapContact[] }) {
  const [view, setView] = useState<"state" | "city">("state");
  const [foundingOnly, setFoundingOnly] = useState(false);

  const filtered = useMemo(
    () => foundingOnly ? contacts.filter((c) => c.foundingMemberStatus === "Approved") : contacts,
    [contacts, foundingOnly],
  );

  const foundingCount = useMemo(
    () => contacts.filter((c) => c.foundingMemberStatus === "Approved").length,
    [contacts],
  );

  const byState = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of filtered) {
      for (const st of c.state.split(", ")) {
        if (st) map.set(st, (map.get(st) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const byCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of filtered) {
      if (c.city) {
        const label = `${c.city}, ${c.state.split(", ")[0]}`;
        map.set(label, (map.get(label) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const rows = view === "state" ? byState : byCity;
  const countLabel = foundingOnly ? "Founding Members" : "Licensed Contacts";

  const handleDownload = () => {
    const prefix = foundingOnly ? "founding-members" : "licensed-contacts";
    const stateCSV = `State,${countLabel}\n` + byState.map((r) => `${r.name},${r.count}`).join("\n");
    const cityCSV = `City,${countLabel}\n` + byCity.map((r) => `"${r.name}",${r.count}`).join("\n");

    const blob1 = new Blob([stateCSV], { type: "text/csv" });
    const url1 = URL.createObjectURL(blob1);
    const a1 = document.createElement("a");
    a1.href = url1;
    a1.download = `${prefix}-by-state.csv`;
    a1.click();
    URL.revokeObjectURL(url1);

    setTimeout(() => {
      const blob2 = new Blob([cityCSV], { type: "text/csv" });
      const url2 = URL.createObjectURL(blob2);
      const a2 = document.createElement("a");
      a2.href = url2;
      a2.download = `${prefix}-by-city.csv`;
      a2.click();
      URL.revokeObjectURL(url2);
    }, 300);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {foundingOnly ? "Founding Members" : "Licensed Contacts"} by Location
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length} {foundingOnly ? "approved founding members" : "people with a verified license"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFoundingOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              foundingOnly
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${foundingOnly ? "bg-emerald-500" : "bg-slate-300"}`} />
            Founding Members
          </button>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            <button
              onClick={() => setView("state")}
              className={`px-3 py-1.5 transition-colors ${view === "state" ? "bg-[#5375FF] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              By State
            </button>
            <button
              onClick={() => setView("city")}
              className={`px-3 py-1.5 transition-colors ${view === "city" ? "bg-[#5375FF] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              By City
            </button>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>
      <div className="max-h-[340px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="text-left px-5 py-2 text-xs font-medium text-slate-500">{view === "state" ? "State" : "City"}</th>
              <th className="text-right px-5 py-2 text-xs font-medium text-slate-500">{countLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((r) => (
              <tr key={r.name} className="hover:bg-slate-50/50">
                <td className="px-5 py-2.5 text-slate-700">{r.name}</td>
                <td className="px-5 py-2.5 text-right font-medium text-slate-900">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main MapClient ──────────────────────────────────────────────────────────

export function MapClient({ contacts }: { contacts: MapContact[] }) {
  const [selected, setSelected] = useState<MapContact | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Map */}
      <div className="relative w-full rounded-xl overflow-hidden border border-white/10" style={{ height: "calc(100vh - 14rem)" }}>
        <LeafletMap contacts={contacts} onSelect={setSelected} />

        {/* Pin count badge */}
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 rounded-full bg-[#2E3946]/90 backdrop-blur border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300">
          <MapPin className="h-3.5 w-3.5 text-[#5375FF]" />
          {contacts.length} contacts mapped
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-2 rounded-xl bg-[#2E3946]/90 backdrop-blur border border-white/10 px-3.5 py-3">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Pin Color</p>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#5375FF" }} />
            Agent
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#7c3aed" }} />
            Broker
          </div>
          <div className="border-t border-white/10 my-0.5" />
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Ring</p>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="inline-block w-3 h-3 rounded-full border-2" style={{ borderColor: "#10b981", background: "transparent" }} />
            Founding Member
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="inline-block w-3 h-3 rounded-full border-2" style={{ borderColor: "#a855f7", background: "transparent" }} />
            Multi-State Licensed
          </div>
        </div>

        {/* Detail modal */}
        {selected && (
          <div className="absolute inset-y-0 right-0 z-[1001] w-80 bg-[#2E3946] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between p-5 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    selected.foundingMemberStatus === "Approved"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : selected.role.trim().toLowerCase() === "broker"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-blue-500/20 text-blue-300"
                  }`}>
                    {selected.foundingMemberStatus === "Approved" ? "Founding Member" : selected.role.trim()}
                  </span>
                  {selected.multiState && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-purple-500/20 text-purple-300">
                      Multi-State
                    </span>
                  )}
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

            <div className="flex-1 overflow-y-auto p-5 space-y-0.5">
              <DetailRow label="Email" value={selected.email} icon={Mail} />
              {selected.trustScore !== null && (
                <DetailRow label="Trust Score" value={String(selected.trustScore)} icon={Shield} />
              )}
              <DetailRow label="Agent License" value={selected.agentsLicense} icon={Hash} />
              <DetailRow label="Brokerage License" value={selected.brokerageLicense} icon={Briefcase} />
              <DetailRow label="License Verified" value={selected.licenseVerified} icon={CheckCircle} />
              <DetailRow label="Expiration" value={selected.expiration} icon={Clock} />
              <DetailRow label="Founding Member Status" value={selected.foundingMemberStatus} icon={User} />
              <DetailRow label="Notes" value={selected.notes} icon={FileText} />
            </div>
          </div>
        )}
      </div>

      {/* Location Table */}
      <LocationTable contacts={contacts} />
    </div>
  );
}
