import { MoxieAvatar } from "@/components/MoxieAvatar";

export function HomeMoxie() {
  return (
    <section className="home-moxie" aria-labelledby="moxie-title">
      <div className="home-moxie-inner">
        <div className="home-moxie-grid">
          <div>
            <div className="home-moxie-eyebrow">§ 03 · MEET MOXIE</div>
            <h2 id="moxie-title">Meet MOXIE. <em>Your growth companion.</em></h2>
            <p className="home-moxie-body">Knowing what to do is half the work. Doing it is the other half. MOXIE is the marketing partner inside MOXIEMO. He knows your business, remembers your goals and keeps track of what comes next. When a post is ready, a decision is waiting or a priority stalls, he tells you, with the context and one easy reply.</p>
            <div className="home-moxie-release"><span aria-hidden="true" />Two-way texting with MOXIE is coming in a future release.</div>
            <h3>When texting opens, you set the pace</h3>
            <div className="home-moxie-paces">
              {[["ESSENTIAL", "Decisions only."], ["BALANCED", "Keep me moving."], ["HANDS-ON", "Active accountability."]].map(([title, body]) => <div key={title}><h4>{title}</h4><p>{body}</p></div>)}
            </div>
          </div>
          <div>
            <div className="home-moxie-preview">
              <div className="home-moxie-preview-label">PREVIEW · COMING IN A FUTURE RELEASE</div>
              <div className="home-moxie-character"><MoxieAvatar pose="phone" size={220} decorative /></div>
              <div className="home-moxie-phone" aria-label="Preview of a future text conversation with MOXIE">
              <div className="home-moxie-phone-header"><MoxieAvatar pose="icon" size={24} decorative />MOXIE</div>
              <div className="home-moxie-message"><span>MOXIE</span><p>Morning! Your Instagram post for today is ready. It supports the qualified-traffic goal in your plan. Want me to publish it at 11 AM? Reply YES or REVIEW.</p></div>
              <div className="home-moxie-message home-moxie-reply"><span>You</span><p>YES</p></div>
              <div className="home-moxie-message"><span>MOXIE</span><p>Approved. It is scheduled for 11 AM. One less thing on your plate.</p></div>
              </div>
            </div>
            <div className="home-moxie-pills">{["Approvals", "Reminders", "Weekly wins", "Stalled priorities", "Test results", "Your check-ins"].map(item => <span key={item}>{item}</span>)}</div>
          </div>
        </div>
        <p className="home-moxie-fine">When texting opens, MOXIE will text only you and the teammates you approve. He never texts your customers. A YES approves one specific action. Bigger decisions, like ad spend, billing or account changes, always ask for more than a one-word reply. You will be able to set quiet hours, snooze, pause or reply STOP at any time. Message and data rates may apply.</p>
      </div>
    </section>
  );
}