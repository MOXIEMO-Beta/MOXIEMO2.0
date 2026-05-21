const stats = [
  { v: "18+", l: "hrs back per week" },
  { v: "4–6", l: "tools eliminated" },
  { v: "20 min", l: "to full strategy" },
  { v: "$93K", l: "saved annually" },
];

export function StatsBar() {
  return (
    <div
      className="rounded-2xl bg-[#f8f8f8] w-full"
      style={{ padding: "clamp(32px, 6vw, 60px) clamp(20px, 6vw, 80px)", maxWidth: "100%", boxSizing: "border-box" }}
    >
      <div className="text-center mb-10">
        <h2 className="font-bold text-foreground" style={{ fontSize: 28 }}>
          The numbers don't lie.
        </h2>
        <p
          className="text-muted-foreground mt-3 mx-auto"
          style={{ fontSize: 16, maxWidth: 560 }}
        >
          Every founder who runs MOXIEMO Discovery gets a complete marketing strategy in minutes. Here is what founders stop wasting time and money on.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
        {stats.map((s, i) => (
          <div
            key={s.l}
            className="text-center flex flex-col items-center justify-center relative md:px-6"
          >
            {i > 0 && (
              <span
                aria-hidden
                className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2"
                style={{ width: 1, height: 40, background: "#e0e0e0" }}
              />
            )}
            <div
              className="font-bold leading-none mb-3"
              style={{ color: "#ff6b6b", fontSize: "clamp(36px, 10vw, 64px)", whiteSpace: "nowrap", verticalAlign: "middle" }}
            >
              {s.v}
            </div>
            <div
              className="text-muted-foreground font-semibold uppercase"
              style={{ fontSize: 12, letterSpacing: "1.5px" }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}