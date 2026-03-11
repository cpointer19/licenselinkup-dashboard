"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { BarChart2, Instagram, Facebook, Monitor, X, ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/stats-card";
import { UserCheck, ClipboardCheck, Award } from "lucide-react";

export interface AdRow {
  rawAdName: string;
  adName: string;
  rawAdset: string;
  adsetName: string | null;
  becameLead: number;
  profileCreated: number;
  foundingMember: number;
  siteSource: string | null;
}

interface Props {
  ads: AdRow[];
}

const STAGE_COLORS = {
  becameLead: "#5375FF",
  profileCreated: "#8b5cf6",
  foundingMember: "#10b981",
};

// Map rawAdName substrings (lowercase) → { image path, isVideo }
// Add new entries here as creatives are uploaded.
const AD_IMAGES: Record<string, { src: string; isVideo?: boolean }> = {
  "state-line-map":        { src: "/ads/state-line-map.jpg" },
  "state-line-lance-vo":   { src: "/ads/state-line-lance-vo.jpg",   isVideo: true },
  "state-line-kill-a-deal":{ src: "/ads/state-line-kill-a-deal.jpg", isVideo: true },
};

function getAdImage(rawAdName: string): { src: string; isVideo?: boolean } | null {
  const lower = rawAdName.toLowerCase();
  for (const [key, val] of Object.entries(AD_IMAGES)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function SiteSourceBadge({ source }: { source: string | null }) {
  if (!source) return null;
  const lower = source.toLowerCase();
  if (lower.includes("instagram")) {
    return (
      <Badge className="bg-pink-50 text-pink-700 border-pink-200 gap-1 text-[10px] px-1.5 py-0">
        <Instagram className="h-2.5 w-2.5" /> Instagram
      </Badge>
    );
  }
  if (lower.includes("facebook")) {
    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[10px] px-1.5 py-0">
        <Facebook className="h-2.5 w-2.5" /> Facebook
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
      <Monitor className="h-2.5 w-2.5" /> {source}
    </Badge>
  );
}

function truncateAdName(name: string, n = 48): string {
  return name.length > n ? name.slice(0, n - 1) + "…" : name;
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-slate-800 mb-1.5 max-w-[220px] leading-snug">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-medium text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// Ad image thumbnail — click to open modal
function AdThumbnail({
  rawAdName,
  onOpen,
}: {
  rawAdName: string;
  onOpen: (src: string) => void;
}) {
  const ad = getAdImage(rawAdName);

  if (!ad) {
    return (
      <div className="h-12 w-10 flex-shrink-0 rounded border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
        <ImageIcon className="h-3.5 w-3.5 text-slate-300" />
      </div>
    );
  }

  return (
    <button
      onClick={() => onOpen(ad.src)}
      className="relative h-12 w-10 flex-shrink-0 rounded overflow-hidden border border-slate-200 hover:border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#5375FF] focus:ring-offset-1"
      title="Click to preview"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ad.src} alt="Ad creative" className="h-full w-full object-cover" />
      {ad.isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="h-4 w-4 rounded-full bg-white/90 flex items-center justify-center">
            <span className="text-[7px] text-slate-800 pl-0.5">▶</span>
          </div>
        </div>
      )}
    </button>
  );
}

// Full-screen modal overlay
function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 rounded-full bg-white shadow-md p-1.5 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Ad creative"
          className="w-full h-auto rounded-xl shadow-2xl max-h-[90vh] object-contain"
        />
      </div>
    </div>
  );
}

export function MetaAdsClient({ ads }: Props) {
  const [filter, setFilter] = useState<"all" | "instagram" | "facebook">("all");
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  // Exclude test ads and rows with raw UTM field names (bad tracking data)
  const visibleAds = useMemo(
    () => ads.filter((a) =>
      !a.rawAdName.toLowerCase().includes("test") &&
      !a.rawAdName.toLowerCase().startsWith("utm_")
    ),
    [ads]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return visibleAds;
    return visibleAds.filter((a) => {
      const s = a.siteSource?.toLowerCase() ?? "";
      return filter === "instagram" ? s.includes("instagram") : s.includes("facebook");
    });
  }, [visibleAds, filter]);

  // Summary stats (excluding test ads)
  const totalLeads = visibleAds.reduce((s, a) => s + a.becameLead, 0);
  const totalProfiles = visibleAds.reduce((s, a) => s + a.profileCreated, 0);
  const totalFoundingMembers = visibleAds.reduce((s, a) => s + a.foundingMember, 0);

  const instagramAds = visibleAds.filter((a) => a.siteSource?.toLowerCase().includes("instagram")).length;
  const facebookAds = visibleAds.filter((a) => a.siteSource?.toLowerCase().includes("facebook")).length;

  // Chart data — full ad names in tooltip, truncated on axis
  const chartData = filtered.map((a) => ({
    name: truncateAdName(a.rawAdName) + (a.rawAdset ? `\n${truncateAdName(a.rawAdset, 36)}` : ""),
    fullName: a.rawAdName + (a.rawAdset ? ` | ${a.rawAdset}` : ""),
    "Became Lead": a.becameLead,
    "Profile Created": a.profileCreated,
    "Founding Member": a.foundingMember,
    siteSource: a.siteSource,
  }));

  const chartHeight = Math.max(300, filtered.length * 68);

  return (
    <div className="space-y-6">
      {modalSrc && <ImageModal src={modalSrc} onClose={() => setModalSrc(null)} />}

      <PageHeader
        title="Meta Ad Performance"
        description="Which ads are driving leads through the conversion pipeline"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Ads Tracked"
          value={ads.length}
          subtitle={`${instagramAds} Instagram · ${facebookAds} Facebook`}
          icon={BarChart2}
          iconColor="text-[#5375FF]"
          iconBg="bg-[#5375FF]/10"
        />
        <StatsCard
          title="Attributed Leads"
          value={totalLeads}
          subtitle="Became Lead via ad"
          icon={UserCheck}
          iconColor="text-[#5375FF]"
          iconBg="bg-[#5375FF]/10"
        />
        <StatsCard
          title="Profiles Created"
          value={totalProfiles}
          subtitle="Via attributed ad"
          icon={ClipboardCheck}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
        />
        <StatsCard
          title="Founding Members"
          value={totalFoundingMembers}
          subtitle="Via attributed ad"
          icon={Award}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "instagram", "facebook"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f === "instagram" && <Instagram className="h-3 w-3" />}
            {f === "facebook" && <Facebook className="h-3 w-3" />}
            {f === "all" ? "All Sources" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`rounded px-1 text-[10px] ${filter === f ? "bg-white/20" : "bg-slate-100"}`}>
              {f === "all"
                ? visibleAds.length
                : f === "instagram"
                ? instagramAds
                : facebookAds}
            </span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Leads by Ad</CardTitle>
          <CardDescription>Contacts attributed to each ad, broken down by pipeline stage</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-6">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400">
              No ads found for this source.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
                barCategoryGap="30%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 13, fill: "#334155" }}
                  axisLine={false}
                  tickLine={false}
                  width={340}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Legend
                  content={() => (
                    <div className="flex items-center justify-center gap-5 pt-1" style={{ fontSize: 12, color: "#475569" }}>
                      {[
                        { label: "Became Lead",     color: STAGE_COLORS.becameLead },
                        { label: "Profile Created", color: STAGE_COLORS.profileCreated },
                        { label: "Founding Member", color: STAGE_COLORS.foundingMember },
                      ].map(({ label, color }) => (
                        <span key={label} className="flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                />
                <Bar dataKey="Became Lead" fill={STAGE_COLORS.becameLead} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Profile Created" fill={STAGE_COLORS.profileCreated} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Founding Member" fill={STAGE_COLORS.foundingMember} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Breakdown</CardTitle>
          <CardDescription>Full data with source attribution</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-14 px-4 py-3" />
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#5375FF] uppercase tracking-wide">Leads</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">Profiles Created</th>
                  <th className="text-right pl-4 pr-8 py-3 text-xs font-semibold text-emerald-600 uppercase tracking-wide">Founding Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((ad, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    {/* Image preview */}
                    <td className="px-4 py-2">
                      <AdThumbnail rawAdName={ad.rawAdName} onOpen={setModalSrc} />
                    </td>
                    {/* Ad name */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-4 flex-shrink-0">#{i + 1}</span>
                        <div>
                          <p className="font-medium text-slate-800 leading-snug font-mono text-xs">{ad.rawAdName}</p>
                          {ad.adsetName && (
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{ad.rawAdset}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <SiteSourceBadge source={ad.siteSource} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="font-bold text-[#5375FF]">{ad.becameLead}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="font-semibold text-violet-600">{ad.profileCreated}</span>
                    </td>
                    <td className="pl-4 pr-8 py-2 text-right">
                      <span className="font-semibold text-emerald-600">{ad.foundingMember}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                      No ads found for this source.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
