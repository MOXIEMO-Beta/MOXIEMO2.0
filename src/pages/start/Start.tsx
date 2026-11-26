import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RouteMetadata } from "@/components/RouteMetadata";
import { StartHeader } from "./StartHeader";
import { Hero } from "./Hero";
import { HowWeStart } from "./HowWeStart";
import { Guesswork } from "./Guesswork";
import { Assessment } from "./Assessment";
import { WhyDifferent } from "./WhyDifferent";
import { MeetMoxie } from "./MeetMoxie";
import { Founding } from "./Founding";
import { StartFooter } from "./StartFooter";
import { captureCampaign } from "./campaign";
import "@/styles/start.css";
import heroMoxie from "@/assets/moxie/moxie-wave.png";

export default function Start() {
  const { search, hash } = useLocation();
  const campaign = useMemo(() => captureCampaign(search), [search]);
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [hash]);
  return <div className="start-page">
    <RouteMetadata title="MOXIEMO | Find your next growth move" description="Run a free growth assessment, meet MOXIE, and claim one of 100 founding seats at 50% off for life." />
    <Helmet>
      <meta name="robots" content="noindex, follow" />
      <link rel="preload" as="image" href={heroMoxie} />
    </Helmet>
    <StartHeader />
    <main><Hero /><HowWeStart /><Guesswork /><Assessment /><WhyDifferent /><MeetMoxie /><Founding /></main>
    <StartFooter campaign={campaign} />
  </div>;
}
