"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, ChevronDown, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
}

function buildSummaryLines(data: WeeklySummary): string[] {
  const { newContacts, campaigns, automations, totalContacts } = data;
  const lines: string[] = [];

  lines.push(`Hey! I just pulled your LicenseLinkUp data for the past 7 days. Here's what's been happening:`);
  lines.push("");

  if (newContacts.count > 0) {
    const nameList = newContacts.names.slice(0, 3).join(", ");
    const extra = newContacts.count > 3 ? ` and ${newContacts.count - 3} others` : "";
    lines.push(`📥 New Contacts: You welcomed ${newContacts.count} new contact${newContacts.count !== 1 ? "s" : ""} this week — ${nameList}${extra}. Your total audience is now ${totalContacts.toLocaleString()} contacts.`);
  } else {
    lines.push(`📥 New Contacts: No new contacts joined this week. Your total audience remains at ${totalContacts.toLocaleString()} contacts — all existing relationships are holding steady.`);
  }

  lines.push("");

  if (campaigns.count > 0) {
    lines.push(`📧 Campaigns: You sent ${campaigns.count} campaign${campaigns.count !== 1 ? "s" : ""} this week, reaching ${campaigns.sent.toLocaleString()} recipients.`);
    if (campaigns.topName) lines.push(`   Most recent: "${campaigns.topName}"`);
    if (campaigns.openRate) {
      const rate = parseFloat(campaigns.openRate);
      const emoji = rate >= 25 ? "🔥" : rate >= 15 ? "✅" : "📊";
      lines.push(`   ${emoji} Open rate: ${campaigns.openRate}% — ${rate >= 25 ? "excellent!" : rate >= 15 ? "solid performance." : "room to grow — consider testing subject lines."}`);
    }
    if (campaigns.clicks > 0) {
      lines.push(`   🖱️ ${campaigns.clicks.toLocaleString()} unique clicks — your audience is engaging with your content.`);
    }
  } else {
    lines.push(`📧 Campaigns: No campaigns were sent this week. This could be a good time to reconnect with your ${totalContacts.toLocaleString()} contacts — even a quick update can maintain engagement.`);
  }

  lines.push("");

  lines.push(`⚡ Automations: ${automations.active} of your ${automations.total} automations are currently active, quietly working in the background to nurture your licensing community.`);

  lines.push("");

  // Smart insight
  if (newContacts.count > 5 && campaigns.count === 0) {
    lines.push(`💡 Insight: You have strong new contact momentum this week, but no campaigns went out. Consider sending a welcome-focused email to your newest members while they're still warm!`);
  } else if (campaigns.count > 0 && newContacts.count === 0) {
    lines.push(`💡 Insight: Great email activity this week! To keep the momentum going, consider promoting your platform to drive new signups — your active campaigns are a perfect warm intro.`);
  } else if (newContacts.count > 0 && campaigns.count > 0) {
    lines.push(`💡 Insight: Solid week all around — new contacts coming in and campaigns going out. Keep up the momentum!`);
  } else {
    lines.push(`💡 Insight: A quieter week — a great time to plan your next campaign or review your automation sequences to ensure they're optimized for your licensing community.`);
  }

  return lines;
}

export function ClaudeBot() {
  const [data, setData]         = useState<WeeklySummary | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [charIdx, setCharIdx]   = useState(0);
  const [lineIdx, setLineIdx]   = useState(0);
  const [typing, setTyping]     = useState(false);
  const [pulsing, setPulsing]   = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch summary
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

  // Start typing animation once data is loaded
  useEffect(() => {
    if (!data) return;
    setDisplayed([]);
    setCharIdx(0);
    setLineIdx(0);
    setTyping(true);
    setPulsing(true);
  }, [data]);

  const lines = data ? buildSummaryLines(data) : [];

  // Typing effect
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
      // Type next char
      const speed = currentLine === "" ? 1 : currentLine.startsWith("💡") ? 18 : 12;
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
      // Move to next line
      const pause = currentLine === "" ? 100 : 300;
      const timer = setTimeout(() => {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
      }, pause);
      return () => clearTimeout(timer);
    }
  }, [typing, lineIdx, charIdx, lines]);

  // Auto-scroll to bottom as text types
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
    <Card className="border-blue-100 bg-gradient-to-br from-blue-50/60 to-violet-50/40 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100">
          <div className="flex items-center gap-3">
            {/* Animated Claude avatar */}
            <div className="relative flex h-10 w-10 items-center justify-center">
              {/* Outer pulse ring */}
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

        {/* Body — scrollable, fixed height */}
        <div ref={scrollRef} className="h-48 overflow-y-auto px-5 py-4 scroll-smooth">
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
              {/* Cursor */}
              {typing && (
                <span className="inline-block h-4 w-0.5 bg-blue-500 animate-pulse ml-0.5 translate-y-0.5" />
              )}
            </div>
          )}
        </div>

        {/* Dates footer */}
        {data && (
          <div className="flex items-center justify-between border-t border-blue-100 px-5 py-2.5 text-xs text-slate-400">
            <span>Week of {data.week.start} → {data.week.end}</span>
            <span className="flex items-center gap-1">
              <ChevronDown className="h-3 w-3" /> scroll for more
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
