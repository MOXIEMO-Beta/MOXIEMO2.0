import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinFoundingList, type FoundingResult } from "./joinFoundingList";
import { benefits, validFoundingEmail, startEvent } from "./heroData";
export function HeroFounding() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<FoundingResult>();
  return <div className="start-seat-panel">
    <p className="start-seat-label">As a founding member you get</p>
    <ul className="start-benefits">{benefits.map(text => <li key={text}><span className="start-benefit-check"><Check size={12} /></span><span>{text}</span></li>)}</ul>
    {result ? <div className="start-join-result" role="status"><Check size={20} /><p>{result.message}</p></div> : <form className="start-hero-form" noValidate onSubmit={async e => {
      e.preventDefault();
      if (!validFoundingEmail(email)) { setError("Add your email so I can reach you."); return; }
      if (!firstName.trim()) { setError("Add your first name."); return; }
      setError(""); setPending(true);
      const next = await joinFoundingList({ firstName: firstName.trim(), email: email.trim(), entry: "hero" });
      setResult(next); setPending(false);
      if (next.status === "success") startEvent("start_join_hero");
    }}>
      <div className="start-name-email">
        <div><Label htmlFor="start-first-name">First name</Label><Input className="start-field" id="start-first-name" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
        <div><Label htmlFor="start-email">Email</Label><Input className="start-field" id="start-email" type="email" autoComplete="email" placeholder="you@yourbusiness.com" value={email} onChange={e => setEmail(e.target.value)} aria-describedby={error ? "start-join-error" : undefined} /></div>
      </div>
      {error && <p className="start-form-error" id="start-join-error" role="alert">{error}</p>}
      <Button type="submit" className="start-form-submit" disabled={pending}>{pending ? "Joining..." : "Join the founding list"}</Button>
    </form>}
  </div>;
}
