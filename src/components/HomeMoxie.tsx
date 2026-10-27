export function HomeMoxie() {
  return (
    <section className="home-moxie" aria-labelledby="moxie-title">
      <div className="home-moxie-inner">
        <div className="home-moxie-grid">
          <div>
            <div className="home-moxie-eyebrow">§ 03 · MEET MOXIE</div>
            <h2 id="moxie-title">Meet MOXIE. <em>The nudge that gets it done.</em></h2>
            <p className="home-moxie-body">Knowing what to do is half the work. Doing it is the other half. When a post is ready, a decision is waiting or a priority stalls, MOXIE texts you with the context and one easy reply.</p>
            <h3>You set the pace</h3>
            <div className="home-moxie-paces">
              {[["ESSENTIAL", "Decisions only."], ["BALANCED", "Keep me moving."], ["HANDS-ON", "Active accountability."]].map(([title, body]) => <div key={title}><h4>{title}</h4><p>{body}</p></div>)}
            </div>
          </div>
          <div>
            <div className="home-moxie-phone" aria-label="Sample text conversation with MOXIE">
              <div className="home-moxie-phone-header">MOXIE</div>
              <div className="home-moxie-message"><span>MOXIE</span><p>Morning! Your Instagram post for today is ready. It supports the qualified-traffic goal in your plan. Want me to publish it at 11 AM? Reply YES or REVIEW.</p></div>
              <div className="home-moxie-message home-moxie-reply"><span>You</span><p>YES</p></div>
              <div className="home-moxie-message"><span>MOXIE</span><p>Approved. It is scheduled for 11 AM. One less thing on your plate.</p></div>
            </div>
            <div className="home-moxie-pills">{["Approvals", "Reminders", "Weekly wins", "Stalled priorities", "Test results", "Your check-ins"].map(item => <span key={item}>{item}</span>)}</div>
          </div>
        </div>
        <p className="home-moxie-fine">MOXIE texts you and the teammates you approve. It does not text your customers. A YES approves one specific action. Bigger decisions, like ad spend, billing or account changes, always ask for more than a one-word reply. Set quiet hours, snooze, pause or reply STOP anytime. Message and data rates may apply.</p>
      </div>
    </section>
  );
}