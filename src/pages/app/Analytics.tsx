import { Card } from "@/components/ui/card";

export default function Analytics() {
  const stats = [
    { label: "Discovery calls booked", value: "7", change: "+3 vs last month" },
    { label: "Email open rate", value: "47%", change: "+8pts" },
    { label: "LinkedIn impressions", value: "12.4k", change: "+22%" },
    { label: "Content approval rate", value: "92%", change: "+5pts" },
  ];
  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Analytics</h1>
        <p className="text-muted-foreground">Tied to the success definition you set in discovery.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 border-border shadow-soft">
            <div className="text-sm text-muted-foreground mb-2">{s.label}</div>
            <div className="font-display text-3xl mb-1">{s.value}</div>
            <div className="text-xs text-accent">{s.change}</div>
          </Card>
        ))}
      </div>
      <Card className="p-8 border-border shadow-soft">
        <h3 className="font-medium mb-2">Progress toward your goal</h3>
        <p className="text-sm text-muted-foreground mb-6">2-3 discovery calls/week from warm leads</p>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-accent" style={{ width: "78%" }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground"><span>0</span><span>78% on track</span><span>10/wk</span></div>
      </Card>
    </div>
  );
}