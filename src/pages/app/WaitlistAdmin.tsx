import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Download, Search, Inbox, ChevronDown, ChevronRight, Mail, CalendarDays,
  Check, X, StickyNote, RotateCcw, Send, Loader2, ExternalLink, UserPlus,
} from "lucide-react";

type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  website_url: string | null;
  company_name: string | null;
  referral_source: string | null;
  notes: string | null;
  status: string | null;
  scheduled_call_at: string | null;
  approved_at: string | null;
  beta_code_sent: string | null;
  created_at: string | null;
};

const ZOOM_LINK = "https://scheduler.zoom.us/klmg-ltd/moxie-beta-kickoff";

function relativeTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return "Yesterday";
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusBadge(status: string | null) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: "Pending",   cls: "bg-muted text-muted-foreground border-border" },
    scheduled: { label: "Scheduled", cls: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" },
    approved:  { label: "Approved",  cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
    rejected:  { label: "Rejected",  cls: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20" },
  };
  const m = map[status || "pending"] || map.pending;
  return <Badge variant="outline" className={`font-medium ${m.cls}`}>{m.label}</Badge>;
}

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function WaitlistAdmin() {
  const { user } = useAuth();
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<WaitlistEntry | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);

  async function sendInvite(e: React.FormEvent, mode: "send" | "resend" = "send") {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-invite-user", {
        body: { email: inviteEmail.trim() },
      });
      if (error) throw error;
      toast.success(
        mode === "resend"
          ? `Fresh invite resent to ${inviteEmail}.`
          : `Invite sent to ${inviteEmail}.`
      );
      setInviteEmail("");
      setInviteName("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send invite.");
    } finally {
      setInviting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsAdmin(Boolean((data as any)?.is_admin));
        setAuthChecking(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-waitlist", {
        body: { action: "list" },
      });
      if (error) throw error;
      setEntries((data?.entries || []) as WaitlistEntry[]);
    } catch {
      toast.error("Failed to load waitlist");
      setEntries([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const counts = useMemo(() => {
    const c = { total: entries.length, pending: 0, scheduled: 0, approved: 0, rejected: 0 };
    for (const e of entries) {
      const s = (e.status || "pending") as keyof typeof c;
      if (s in c) (c as any)[s]++;
    }
    return c;
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter !== "all" && (e.status || "pending") !== filter) return false;
      if (!q) return true;
      return [e.name, e.email, e.company_name, e.role].some((v) => v?.toLowerCase().includes(q));
    });
  }, [entries, search, filter]);

  async function updateStatus(id: string, status: string) {
    setActionLoading(id);
    try {
      const { error } = await supabase.functions.invoke("admin-waitlist", {
        body: { action: "update_status", id, status },
      });
      if (error) throw error;
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
      return true;
    } catch {
      toast.error("Failed to update");
      return false;
    } finally {
      setActionLoading(null);
    }
  }

  function handleScheduleCall(entry: WaitlistEntry) {
    const subject = encodeURIComponent("Your MOXIEMO founding member call");
    const body = encodeURIComponent(
      `Hey ${entry.name.split(" ")[0]}, looking forward to connecting!\n\n` +
      `Here's my calendar to pick a time:\n${ZOOM_LINK}`
    );
    window.location.href = `mailto:${entry.email}?subject=${subject}&body=${body}`;
    updateStatus(entry.id, "scheduled");
  }

  async function handleApproveConfirm() {
    if (!pendingApproval) return;
    setActionLoading(pendingApproval.id);
    try {
      const { error } = await supabase.functions.invoke("approve-waitlist", {
        body: { waitlist_id: pendingApproval.id, admin_user_id: user?.id },
      });
      if (error) throw error;
      setEntries((prev) => prev.map((e) =>
        e.id === pendingApproval.id
          ? { ...e, status: "approved", approved_at: new Date().toISOString() }
          : e
      ));
      toast.success(`Approved! Welcome email sent to ${pendingApproval.name}.`);
    } catch (e) {
      toast.error("Failed to approve. Please try again.");
    } finally {
      setActionLoading(null);
      setPendingApproval(null);
    }
  }

  async function handleResend(entry: WaitlistEntry) {
    setActionLoading(entry.id);
    try {
      const { error } = await supabase.functions.invoke("approve-waitlist", {
        body: { waitlist_id: entry.id, admin_user_id: user?.id },
      });
      if (error) throw error;
      toast.success(`Welcome email resent to ${entry.name}.`);
    } catch {
      toast.error("Failed to resend email.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(entry: WaitlistEntry) {
    const ok = await updateStatus(entry.id, "rejected");
    if (ok) toast.success("Entry marked as rejected.");
  }

  async function saveNotes(id: string) {
    const value = editingNotes[id] ?? "";
    setActionLoading(id);
    try {
      const { error } = await supabase.functions.invoke("admin-waitlist", {
        body: { action: "update_notes", id, notes: value },
      });
      if (error) throw error;
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, notes: value } : e)));
      toast.success("Notes saved.");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setActionLoading(null);
    }
  }

  function exportCsv() {
    const headers = ["Name", "Email", "Role", "Company", "Website", "Referral", "Status", "Applied date", "Approved date"];
    const rows = entries.map((e) => [
      e.name, e.email, e.role, e.company_name, e.website_url, e.referral_source,
      e.status, e.created_at, e.approved_at,
    ].map(csvEscape).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MOXIE_Waitlist_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (authChecking) {
    return (
      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        <div className="animate-pulse h-8 w-48 bg-muted rounded mb-6" />
        <div className="animate-pulse h-32 bg-muted rounded" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display text-4xl">Waitlist Admin</h1>
          <p className="text-muted-foreground mt-1">Managing founding member applications</p>
        </div>
        <Button onClick={exportCsv} variant="outline" className="rounded-full">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Direct invite */}
      <Card className="p-4 border-border mt-6">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-4 w-4 text-accent" />
          <h2 className="font-semibold">Send founding member invite</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Sends a Supabase invite email with a link that lands on the password-creation screen.
        </p>
        <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="Full name (optional)"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            className="sm:w-56 h-10"
          />
          <Input
            type="email"
            required
            placeholder="invitee@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 h-10"
          />
          <Button type="submit" disabled={inviting} className="h-10">
            {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send invite
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={inviting || !inviteEmail}
            onClick={(e) => sendInvite(e as any, "resend")}
            className="h-10"
            title="Generates a fresh invite token for this email"
          >
            Resend invite
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Tip: use Resend invite to issue a fresh token if a user reports an expired link.
        </p>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 mb-6">
        {[
          { label: "Total", value: counts.total, cls: "" },
          { label: "Pending", value: counts.pending, cls: "" },
          { label: "Scheduled", value: counts.scheduled, cls: "text-blue-600 dark:text-blue-400" },
          { label: "Approved", value: counts.approved, cls: "text-emerald-600 dark:text-emerald-400" },
          { label: "Rejected", value: counts.rejected, cls: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4 border-border">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 border-border mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="sm:w-44 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>
      </Card>

      {/* Table / list */}
      <Card className="border-border overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-muted/60 animate-pulse rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No waitlist entries yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Share your waitlist form and founding members will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden md:grid grid-cols-[1.2fr_1.4fr_0.9fr_1fr_0.7fr_0.7fr_auto] gap-3 px-4 py-2.5 bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground font-medium">
              <div>Name</div><div>Email</div><div>Role</div><div>Company</div><div>Applied</div><div>Status</div><div className="text-right">Actions</div>
            </div>
            {filtered.map((e) => {
              const isOpen = expanded === e.id;
              const status = (e.status || "pending");
              return (
                <div key={e.id} className="bg-card">
                  <div
                    role="button"
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                    className="grid md:grid-cols-[1.2fr_1.4fr_0.9fr_1fr_0.7fr_0.7fr_auto] gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer items-center"
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      {e.name}
                    </div>
                    <a
                      href={`mailto:${e.email}`}
                      onClick={(ev) => ev.stopPropagation()}
                      className="text-sm text-muted-foreground hover:text-foreground truncate"
                    >
                      {e.email}
                    </a>
                    <div className="text-sm text-muted-foreground">{e.role || "—"}</div>
                    <div className="text-sm text-muted-foreground truncate">{e.company_name || "—"}</div>
                    <div className="text-sm text-muted-foreground">{relativeTime(e.created_at)}</div>
                    <div>{statusBadge(status)}</div>
                    <div className="flex flex-wrap justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
                      {status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleScheduleCall(e)} className="h-8">
                            <CalendarDays className="h-3.5 w-3.5 mr-1" /> Schedule
                          </Button>
                          <Button size="sm" onClick={() => setPendingApproval(e)} disabled={actionLoading === e.id} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReject(e)} disabled={actionLoading === e.id} className="h-8 text-red-600 hover:text-red-700">
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {status === "scheduled" && (
                        <>
                          <Button size="sm" onClick={() => setPendingApproval(e)} disabled={actionLoading === e.id} className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(e.id, "pending")} className="h-8">
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Back to pending
                          </Button>
                        </>
                      )}
                      {status === "approved" && (
                        <Button size="sm" variant="outline" onClick={() => handleResend(e)} disabled={actionLoading === e.id} className="h-8">
                          {actionLoading === e.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                          Resend email
                        </Button>
                      )}
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => {
                          setExpanded(e.id);
                          setEditingNotes((p) => ({ ...p, [e.id]: e.notes ?? "" }));
                        }}
                        className="h-8"
                      >
                        <StickyNote className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-5 pt-1 bg-muted/20">
                      <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2.5">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Website</div>
                            {e.website_url ? (
                              <a href={e.website_url} target="_blank" rel="noopener noreferrer" className="text-foreground inline-flex items-center gap-1 hover:underline">
                                {e.website_url} <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : <span className="text-muted-foreground">—</span>}
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Heard about MOXIEMO via</div>
                            <div>{e.referral_source || "—"}</div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">Applied</div>
                            <div>{e.created_at ? new Date(e.created_at).toLocaleString() : "—"}</div>
                          </div>
                          <Button asChild size="sm" variant="outline" className="mt-2">
                            <a href={`mailto:${e.email}`}><Mail className="h-3.5 w-3.5 mr-1.5" />Open email</a>
                          </Button>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Notes</div>
                          <Textarea
                            value={editingNotes[e.id] ?? e.notes ?? ""}
                            onChange={(ev) => setEditingNotes((p) => ({ ...p, [e.id]: ev.target.value }))}
                            placeholder="Add notes about this applicant..."
                            className="min-h-[100px]"
                          />
                          <Button
                            size="sm" onClick={() => saveNotes(e.id)} disabled={actionLoading === e.id}
                            className="mt-2 bg-foreground text-background hover:bg-foreground/90"
                          >
                            {actionLoading === e.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                            Save notes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AlertDialog open={!!pendingApproval} onOpenChange={(o) => !o && setPendingApproval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {pendingApproval?.name} as a founding member?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 pt-2 text-sm">
                <div className="flex gap-2 items-start"><Check className="h-4 w-4 text-emerald-600 mt-0.5" /> Send them the MOXIE2026 beta code</div>
                <div className="flex gap-2 items-start"><Check className="h-4 w-4 text-emerald-600 mt-0.5" /> Send a personal welcome email from Karee</div>
                <div className="flex gap-2 items-start"><Check className="h-4 w-4 text-emerald-600 mt-0.5" /> Mark them as approved in the system</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Yes, approve and send code →
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}