"use client";

import { useState } from "react";
import { Download, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CsvExportButtonProps {
  /** Human-readable label for the button */
  label?: string;
  /** The API endpoint to fetch data from */
  endpoint: string;
  /** Key in the JSON response that holds the array of records */
  dataKey: string;
  /** Filename for the downloaded CSV (without .csv) */
  filename?: string;
}

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  return Object.keys(obj).reduce<Record<string, string>>((acc, key) => {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(acc, flattenObject(val as Record<string, unknown>, newKey));
    } else if (Array.isArray(val)) {
      acc[newKey] = val
        .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v ?? "")))
        .join("|");
    } else {
      acc[newKey] = String(val ?? "");
    }
    return acc;
  }, {});
}

function toCsv(records: Record<string, unknown>[]): string {
  if (!records.length) return "";
  const flat = records.map((r) => flattenObject(r));
  const headers = Array.from(new Set(flat.flatMap(Object.keys)));
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = flat.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","));
  return [headers.map(escape).join(","), ...rows].join("\n");
}

export function CsvExportButton({
  label = "Export CSV",
  endpoint,
  dataKey,
  filename = "export",
}: CsvExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      const records: Record<string, unknown>[] = json[dataKey] ?? [];
      const csv = toCsv(records);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("CSV export failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={loading}
        className="gap-1.5"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {label}
      </Button>

      {/* Tooltip info icon */}
      <div className="relative">
        <button
          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          aria-label="Export info"
        >
          <Info className="h-4 w-4" />
        </button>
        {showTip && (
          <div className="absolute right-7 top-1/2 -translate-y-1/2 z-50 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800 mb-1">Export for AI Analysis</p>
            <p>
              Downloads all visible data as a <strong>CSV file</strong> — the universal format for data
              analysis. You can upload this file directly to{" "}
              <strong>ChatGPT</strong>, <strong>Claude</strong>, or any AI assistant to ask questions,
              spot trends, and generate insights from your ActiveCampaign data.
            </p>
            <p className="mt-1.5 text-slate-400">
              Tip: nested data (tags, lists, automations) is pipe-separated within cells.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
