"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, RefreshCw, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PipelineStage {
  stage: string;
  count: number;
}

interface WeeklySummary {
  week: { start: string; end: string };
  newContacts: { count: number; names: string[] };
  campaigns: {
    count: number;
    sent: number;
    opens: number;
    clicks: number;
    openRate: string | null;
    topName: string | null;
  };
  automations: { active: number; total: number };
  totalContacts: number;
  pipeline: PipelineStage[];
}

function buildSummaryLines(data: WeeklySummary): string[] {
  const { newContacts, campaigns, automations, totalContacts, pipeline } = data;
  const lines: string[] = [];

  lines.push(`Hey! I just pulled your LicenseLinkUp data for the past 7 days (${formatRange(data.week.start, data.week.end)}). Here's what's been happening:`);
  lines.push("");

  // --- Leads ---
  if (newContacts.count > 0) {
    const nameList = newContacts.names.slice(0, 3).join(", ");
    const extra = newContacts.count > 3 ? ` and ${newContacts.count - 3} others` : "";
    lines.push(`📥 New Leads: You welcomed ${newContacts.count} new lead${newContacts.count !== 1 ? "s" : ""} this week — ${nameList}${extra}. Your total leads is now ${totalContacts.toLocaleString()}.`);
  } else {
    lines.push(`📥 New Leads: No new leads joined this week. Your total leads remains at ${totalContacts.toLocaleString()}.`);
  }
  lines.push("");



  // --- Pipeline ---
  const leads = pipeline.find((p) => p.stage === "became_lead")?.count ?? 0;
  const profiles = pipeline.find((p) => p.stage === "profile_created")?.count ?? 0;
  const members = pipeline.find((p) => p.stage === "onboarding_complete")?.count ?? 0;

  if (leads > 0 || profiles > 0 || members > 0) {
    const convRate = leads > 0 ? ((members / leads) * 100).toFixed(1) : "0";
    lines.push(`🔄 Pipeline: ${leads} leads → ${profiles} profiles → ${members} founding members (${convRate}% full conversion rate).`);
    if (profiles > 0 && members < profiles) {
      const dropOff = profiles - members;
      lines.push(`   📌 ${dropOff} contact${dropOff !== 1 ? "s" : ""} created a profile but haven't completed onboarding yet — a targeted nudge could help.`);
    }
  }
  lines.push("");

  // --- Insight ---
  if (newContacts.count > 5) {
    lines.push(`💡 Insight: Strong new lead momentum this week! Send a welcome email while leads are warm.`);
  } else if (newContacts.count > 0) {
    lines.push(`💡 Insight: New leads coming in — keep the momentum going!`);
  } else {
    lines.push(`💡 Insight: Quieter week — review automation sequences for optimization or promote your platform to drive new signups.`);
  }

  return lines;
}

function formatRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  return `${fmt(start)} → ${fmt(end)}`;
}

export function ClaudeBot() {
  const [data, setData]           = useState<WeeklySummary | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [charIdx, setCharIdx]     = useState(0);
  const [lineIdx, setLineIdx]     = useState(0);
  const [typing, setTyping]       = useState(false);
  const [pulsing, setPulsing]     = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ac/weekly-summary")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        setData(d);
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!data) return;
    setDisplayed([]);
    setCharIdx(0);
    setLineIdx(0);
    setTyping(true);
    setPulsing(true);
  }, [data]);

  const lines = data ? buildSummaryLines(data) : [];

  useEffect(() => {
    if (!typing || lineIdx >= lines.length) {
      if (lineIdx >= lines.length && lines.length > 0) {
        setPulsing(false);
        setTyping(false);
      }
      return;
    }

    const currentLine = lines[lineIdx];

    if (charIdx < currentLine.length) {
      const speed = currentLine === "" ? 1 : currentLine.startsWith("💡") ? 18 : 10;
      const timer = setTimeout(() => {
        setDisplayed((prev) => {
          const next = [...prev];
          if (next.length <= lineIdx) next.push("");
          next[lineIdx] = currentLine.slice(0, charIdx + 1);
          return next;
        });
        setCharIdx((i) => i + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      const pause = currentLine === "" ? 80 : 250;
      const timer = setTimeout(() => {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
      }, pause);
      return () => clearTimeout(timer);
    }
  }, [typing, lineIdx, charIdx, lines]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayed]);

  const handleRefresh = () => {
    setLoading(true);
    setData(null);
    setError(null);
    fetch("/api/ac/weekly-summary")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  };

  return (
    <Card className="border-[#E9EAEB] bg-gradient-to-br from-[#5375FF]/5 to-violet-50/30 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E9EAEB]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center">
              {pulsing && (
                <span className="absolute inset-0 rounded-full bg-[#5375FF] opacity-25 animate-ping" />
              )}
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#5375FF] to-violet-600 shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Claude</p>
              <p className="text-xs text-slate-500">Weekly Intelligence Report</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600"
            onClick={handleRefresh}
            title="Refresh summary"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Two-column layout: report + metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#E9EAEB]">
          {/* Left: typed report (takes 2/3) */}
          <div className="lg:col-span-2">
            <div ref={scrollRef} className="h-80 overflow-y-auto px-5 py-4 scroll-smooth">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#5375FF] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#5375FF] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#5375FF] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                  Pulling your data…
                </div>
              )}
              {error && (
                <p className="text-sm text-red-500">Failed to load weekly summary: {error}</p>
              )}
              {!loading && !error && (
                <div className="space-y-0.5 text-sm text-slate-700 leading-relaxed font-[system-ui]">
                  {displayed.map((line, i) =>
                    line === "" ? (
                      <div key={i} className="h-2" />
                    ) : (
                      <p key={i} className="whitespace-pre-wrap">{line}</p>
                    )
                  )}
                  {typing && (
                    <span className="inline-block h-4 w-0.5 bg-[#5375FF] animate-pulse ml-0.5 translate-y-0.5" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: quick KPI sidebar (1/3) */}
          <div className="p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">This Week</p>

            {/* KPI mini cards */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-white/70 p-3 border border-[#E9EAEB]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5375FF]/10">
                  <Users className="h-4 w-4 text-[#5375FF]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{data?.newContacts.count ?? "—"}</p>
                  <p className="text-[11px] text-slate-500">New Leads</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dates footer */}
        {data && (
          <div className="flex items-center justify-between border-t border-[#E9EAEB] px-5 py-2.5 text-xs text-slate-400">
            <span>Week of {formatRange(data.week.start, data.week.end)}</span>
            <span>{data.totalContacts.toLocaleString()} total leads</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
