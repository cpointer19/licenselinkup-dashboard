"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, RefreshCw, Users, Mail, Zap, ArrowRight } from "lucide-react";
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

const STAGE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  became_lead:         { label: "Leads",            color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  profile_created:     { label: "Profile Created",  color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200" },
  onboarding_complete: { label: "Founding Members", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

function buildSummaryLines(data: WeeklySummary): string[] {
  const { newContacts, campaigns, automations, totalContacts, pipeline } = data;
  const lines: string[] = [];

  lines.push(`Hey! I just pulled your LicenseLinkUp data for the past 7 days. Here's what's been happening:`);
  lines.push("");

  // --- Contacts ---
  if (newContacts.count > 0) {
    const nameList = newContacts.names.slice(0, 3).join(", ");
    const extra = newContacts.count > 3 ? ` and ${newContacts.count - 3} others` : "";
    lines.push(`📥 New Contacts: You welcomed ${newContacts.count} new contact${newContacts.count !== 1 ? "s" : ""} this week — ${nameList}${extra}. Your total audience is now ${totalContacts.toLocaleString()}.`);
  } else {
    lines.push(`📥 New Contacts: No new contacts joined this week. Your total audience remains at ${totalContacts.toLocaleString()} contacts.`);
  }
  lines.push("");

  // --- Campaigns ---
  if (campaigns.count > 0) {
    lines.push(`📧 Campaigns: You sent ${campaigns.count} campaign${campaigns.count !== 1 ? "s" : ""} reaching ${campaigns.sent.toLocaleString()} recipients.`);
    if (campaigns.topName) lines.push(`   Most recent: "${campaigns.topName}"`);
    if (campaigns.openRate) {
      const rate = parseFloat(campaigns.openRate);
      const emoji = rate >= 25 ? "🔥" : rate >= 15 ? "✅" : "📊";
      lines.push(`   ${emoji} Open rate: ${campaigns.openRate}% — ${rate >= 25 ? "excellent!" : rate >= 15 ? "solid performance." : "room to grow."}`);
    }
    if (campaigns.clicks > 0) {
      lines.push(`   🖱️ ${campaigns.clicks.toLocaleString()} unique clicks — your audience is engaging.`);
    }
  } else {
    lines.push(`📧 Campaigns: No campaigns sent this week. Consider reconnecting with your ${totalContacts.toLocaleString()} contacts.`);
  }
  lines.push("");

  // --- Automations ---
  lines.push(`⚡ Automations: ${automations.active} of ${automations.total} automations active, nurturing your licensing community.`);
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
  if (newContacts.count > 5 && campaigns.count === 0) {
    lines.push(`💡 Insight: Strong new contact momentum, but no campaigns went out. Send a welcome email while leads are warm!`);
  } else if (campaigns.count > 0 && newContacts.count === 0) {
    lines.push(`💡 Insight: Great email activity! Promote your platform to drive new signups alongside your active campaigns.`);
  } else if (newContacts.count > 0 && campaigns.count > 0) {
    lines.push(`💡 Insight: Solid week — new contacts coming in and campaigns going out. Keep the momentum!`);
  } else {
    lines.push(`💡 Insight: Quieter week — plan your next campaign or review automation sequences for optimization.`);
  }

  return lines;
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

  const pipeline = data?.pipeline ?? [];
  const showPipeline = !loading && !error && pipeline.some((p) => p.count > 0);
  const maxPipelineCount = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <Card className="border-blue-100 bg-gradient-to-br from-blue-50/60 to-violet-50/40 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center">
              {pulsing && (
                <span className="absolute inset-0 rounded-full bg-blue-400 opacity-25 animate-ping" />
              )}
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-md">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-blue-100">
          {/* Left: typed report (takes 2/3) */}
          <div className="lg:col-span-2">
            <div ref={scrollRef} className="h-80 overflow-y-auto px-5 py-4 scroll-smooth">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
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
                    <span className="inline-block h-4 w-0.5 bg-blue-500 animate-pulse ml-0.5 translate-y-0.5" />
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
              <div className="flex items-center gap-3 rounded-lg bg-white/70 p-3 border border-blue-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{data?.newContacts.count ?? "—"}</p>
                  <p className="text-[11px] text-slate-500">New Contacts</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/70 p-3 border border-blue-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <Mail className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{data?.campaigns.openRate ? `${data.campaigns.openRate}%` : "—"}</p>
                  <p className="text-[11px] text-slate-500">Open Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/70 p-3 border border-blue-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                  <Zap className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{data ? `${data.automations.active}/${data.automations.total}` : "—"}</p>
                  <p className="text-[11px] text-slate-500">Automations Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Pipeline Funnel */}
        {showPipeline && (
          <div className="border-t border-blue-100 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-3">Conversion Pipeline</p>
            <div className="flex items-center gap-2">
              {pipeline.map((stage, idx) => {
                const meta = STAGE_META[stage.stage] ?? { label: stage.stage, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" };
                const widthPct = Math.max((stage.count / maxPipelineCount) * 100, 20);
                return (
                  <div key={stage.stage} className="flex items-center gap-2 flex-1">
                    <div className={`flex-1 rounded-xl border ${meta.border} ${meta.bg} p-3 transition-all`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                      </div>
                      <p className={`text-2xl font-bold ${meta.color}`}>{stage.count.toLocaleString()}</p>
                      {/* Progress bar relative to max */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/80 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: meta.color.includes("blue") ? "#3b82f6" : meta.color.includes("violet") ? "#8b5cf6" : "#10b981",
                          }}
                        />
                      </div>
                      {/* Conversion rate to next stage */}
                      {idx < pipeline.length - 1 && stage.count > 0 && (
                        <p className="mt-1.5 text-[10px] text-slate-400">
                          {((pipeline[idx + 1].count / stage.count) * 100).toFixed(0)}% advance
                        </p>
                      )}
                    </div>
                    {idx < pipeline.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dates footer */}
        {data && (
          <div className="flex items-center justify-between border-t border-blue-100 px-5 py-2.5 text-xs text-slate-400">
            <span>Week of {data.week.start} → {data.week.end}</span>
            <span>{data.totalContacts.toLocaleString()} total contacts</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
