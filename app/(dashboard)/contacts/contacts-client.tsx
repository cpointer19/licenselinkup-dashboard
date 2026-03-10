"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CsvExportButton } from "@/components/csv-export-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ContactDetail } from "./contact-detail";
import { formatDateTime, truncate } from "@/lib/utils";

interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  cdate?: string;
  tagNames: string[];
  listIds: string[];
}

interface Props {
  contacts: Contact[];
  listNames: Record<string, string>;
}

export function ContactsClient({ contacts, listNames }: Props) {
  const [search, setSearch]           = useState("");
  const [selectedId, setSelectedId]   = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q) ||
        c.tagNames.some((t) => t.toLowerCase().includes(q))
    );
  }, [contacts, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contacts"
        description={`${contacts.length} total contacts`}
      >
        <CsvExportButton
          label="Export CSV"
          endpoint="/api/ac/contacts"
          dataKey="contacts"
          filename="licenselinkup-contacts"
        />
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name, email, or tag…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {contacts.length} contacts
      </p>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(c.id)}
                >
                  <TableCell className="text-slate-600">{c.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.tagNames.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">
                          {truncate(t, 20)}
                        </Badge>
                      ))}
                      {c.tagNames.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{c.tagNames.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs whitespace-nowrap">{formatDateTime(c.cdate)}</TableCell>
                </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-slate-400 py-10">
                  No contacts match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Contact detail modal */}
      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
            <DialogDescription>Full profile, tags, automations &amp; email history</DialogDescription>
          </DialogHeader>
          {selectedId && <ContactDetail contactId={selectedId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
