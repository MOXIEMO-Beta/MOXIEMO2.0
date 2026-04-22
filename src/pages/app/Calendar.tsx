import { Card } from "@/components/ui/card";

const days = Array.from({ length: 28 }, (_, i) => i + 1);
const scheduled: Record<number, { ch: string; title: string }[]> = {
  3: [{ ch: "LinkedIn", title: "Hidden cost post" }],
  5: [{ ch: "Email", title: "$600K hustle" }],
  8: [{ ch: "LinkedIn", title: "VA questions" }],
  10: [{ ch: "LinkedIn", title: "Tool fragmentation" }],
  12: [{ ch: "Email", title: "18-hour audit" }],
  15: [{ ch: "LinkedIn", title: "Strategic CEO" }],
  17: [{ ch: "LinkedIn", title: "Identity reclamation" }],
  22: [{ ch: "Email", title: "Newsletter" }],
  24: [{ ch: "LinkedIn", title: "Case study" }],
};

export default function CalendarPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Calendar</h1>
        <p className="text-muted-foreground">30-day view of everything scheduled across your channels.</p>
      </div>
      <Card className="p-4 border-border shadow-soft">
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">{d}</div>
          ))}
          {days.map((d) => (
            <div key={d} className="bg-card min-h-[110px] p-2 text-xs">
              <div className="text-muted-foreground mb-1.5">{d}</div>
              <div className="space-y-1">
                {(scheduled[d] || []).map((s, i) => (
                  <div key={i} className="rounded-md bg-accent-soft text-accent px-1.5 py-1 truncate font-medium">{s.title}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}