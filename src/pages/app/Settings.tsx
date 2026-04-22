import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setName(data?.full_name || "");
      setBusiness(data?.business_name || "");
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
    </div>
  );
}