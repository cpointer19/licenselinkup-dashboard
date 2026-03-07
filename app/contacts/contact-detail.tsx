"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Mail, Tag, Zap, List, Clock } from "lucide-react";

interface ContactDetailData {
  contact: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    cdate?: string;
    udate?: string;
  };
  tags: Array<{ id: string; tag: string; cdate?: string }>;
  lists: Array<{ id: string; list: string; status: string }>;
  automations: Array<{ id: string; automation: string; status: string; completedElements: string; totalElements: string }>;
  emailActivities: Array<{ type?: string; tstamp?: string }>;
}

export function ContactDetail({ contactId }: { contactId: string }) {
  const [data, setData] = useState<ContactDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ac/contact/${contactId}`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [contactId]);

  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!data) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  const { contact, tags, lists, automations, emailActivities } = data;
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email;
  const listNames: Record<string, string> = { "1": "Master Contact List", "2": "Peer Contacts", "3": "Lance Contacts" };
  const autoStatus: Record<string, string> = { "0": "Inactive", "1": "Active", "2": "Completed" };

  return (
    <div className="space-y-5 pt-2">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{name}</p>
          <p className="text-sm text-slate-500">{contact.email}</p>
          {contact.phone && <p className="text-xs text-slate-400">{contact.phone}</p>}
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-400">Joined</p>
          <p className="text-sm font-medium text-slate-700">{formatDate(contact.cdate)}</p>
        </div>
      </div>

      {/* Tags */}
      <section>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          <Tag className="h-3.5 w-3.5" /> Tags ({tags.length})
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {tags.length === 0 && <span className="text-xs text-slate-400">No tags</span>}
          {tags.map((t) => (
            <Badge key={t.id} variant="secondary" className="text-xs">{t.tag}</Badge>
          ))}
        </div>
      </section>

      {/* Lists */}
      <section>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          <List className="h-3.5 w-3.5" /> Lists
        </h3>
        <div className="space-y-1">
          {lists.length === 0 && <p className="text-xs text-slate-400">Not on any lists</p>}
          {lists.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{listNames[l.list] ?? `List ${l.list}`}</span>
              <Badge variant={l.status === "1" ? "success" : "outline"} className="text-[10px]">
                {l.status === "1" ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Automations */}
      <section>
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
          <Zap className="h-3.5 w-3.5" /> Automations ({automations.length})
        </h3>
        <div className="space-y-1.5">
          {automations.length === 0 && <p className="text-xs text-slate-400">No automation history</p>}
          {automations.map((a) => {
            const pct = a.totalElements !== "0"
              ? Math.round((+a.completedElements / +a.totalElements) * 100)
              : 0;
            return (
              <div key={a.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Automation #{a.automation}</span>
                  <Badge variant={a.status === "1" ? "success" : a.status === "2" ? "info" : "outline"} className="text-[10px]">
                    {autoStatus[a.status] ?? "Unknown"}
                  </Badge>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">{a.completedElements}/{a.totalElements} steps · {pct}%</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Email activity */}
      {emailActivities.length > 0 && (
        <section>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            <Mail className="h-3.5 w-3.5" /> Email Activity
          </h3>
          <div className="space-y-1">
            {emailActivities.slice(0, 5).map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <span className="capitalize">{e.type ?? "event"}</span>
                <span className="ml-auto text-slate-400">{formatDate(e.tstamp)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
