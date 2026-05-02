import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Shield } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.full_name || "");
      setBusiness(data?.business_name || "");
      setIsAdmin(Boolean((data as any)?.is_admin));
    });
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name, business_name: business }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved.");
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-3xl mx-auto">
      <h1 className="font-display text-4xl mb-8">Settings</h1>
      <Card className="p-6 border-border shadow-soft space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email || ""} disabled className="mt-1.5 h-11" />
        </div>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11" />
        </div>
        <div>
          <Label htmlFor="biz">Business name</Label>
          <Input id="biz" value={business} onChange={(e) => setBusiness(e.target.value)} className="mt-1.5 h-11" />
        </div>
        <Button onClick={save} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 h-10 rounded-lg">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>

      {isAdmin && (
        <div className="mt-10">
          <div className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" /> Admin
          </div>
          <Card className="p-5 border-border shadow-soft">
            <Link
              to="/app/admin/waitlist"
              className="flex items-center justify-between gap-4 group"
            >
              <div>
                <div className="font-semibold group-hover:text-accent transition">Waitlist Admin →</div>
                <div className="text-sm text-muted-foreground">Manage founding member applications</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition" />
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}