import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import QueueTab from "@/components/social/QueueTab";
import PillarFeedTab from "@/components/social/PillarFeedTab";
import CalendarTabWrapper from "@/components/social/CalendarTabWrapper";

const TABS = ["queue", "calendar", "pillar"] as const;
type TabKey = (typeof TABS)[number];
const LABEL: Record<TabKey, string> = { queue: "Queue", calendar: "Calendar", pillar: "Pillar Feed" };

export default function Social() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const urlTab = sp.get("tab") as TabKey | null;
  const initial: TabKey = urlTab && TABS.includes(urlTab) ? urlTab : "queue";
  const [tab, setTab] = useState<TabKey>(initial);

  function changeTab(t: TabKey) {
    setTab(t);
    sp.set("tab", t); setSp(sp, { replace: true });
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <h1 className="text-[20px] font-bold leading-tight" style={{ color: "#0E0F10" }}>Social</h1>
      <p className="text-[13px] mt-1" style={{ color: "#6B6860" }}>Plan it. Write it. Schedule it.</p>

      <div className="mt-6 mb-6 flex gap-6" style={{ borderBottom: "0.5px solid #ECEAE5" }}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button key={t} onClick={() => changeTab(t)}
              className={cn("text-[13px] pb-2 -mb-px transition")}
              style={{
                color: active ? "#E85A46" : "#6B6860",
                borderBottom: active ? "2px solid #E85A46" : "2px solid transparent",
                fontWeight: active ? 600 : 500,
              }}>{LABEL[t]}</button>
          );
        })}
      </div>

      {tab === "queue" && <QueueTab userId={user?.id ?? null} />}
      {tab === "calendar" && (
        <CalendarTabWrapper
          userId={user?.id ?? null}
          onEditPost={(id) => navigate(`/app/content?postId=${id}`)}
          onCreateAtDate={(iso, pillar) => navigate(`/app/content?date=${iso}${pillar ? `&pillar=${encodeURIComponent(pillar)}` : ""}`)}
          onImportFromContent={() => navigate("/app/content?from=social-calendar")}
        />
      )}
      {tab === "pillar" && <PillarFeedTab userId={user?.id ?? null} />}
    </div>
  );
}