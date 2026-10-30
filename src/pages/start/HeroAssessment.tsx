import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { campaignLink, getVisitCampaign } from "./campaign";
export function HeroAssessment() {
  const [site, setSite] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  return <form className="start-hero-form" noValidate onSubmit={e => {
    e.preventDefault();
    if (!site.trim()) { setError(true); return; }
    const query = new URLSearchParams({ site: site.trim(), entry: "start" });
    navigate(campaignLink(`/brand-audit?${query}`, getVisitCampaign()));
  }}>
    <Label htmlFor="start-website">Your website</Label>
    <Input id="start-website" className="start-field" value={site} placeholder="yourbusiness.com" onChange={e => { setSite(e.target.value); setError(false); }} aria-invalid={error} aria-describedby={error ? "start-site-error" : undefined} />
    {error && <p id="start-site-error" className="start-form-error" role="alert">Add your website so I can take a look.</p>}
    <Button type="submit" className="start-form-submit">Find my growth opportunities</Button>
  </form>;
}
