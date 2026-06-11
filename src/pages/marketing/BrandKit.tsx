import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Upload, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateBrandKitPdf, blobToBase64, type BrandKitData } from "@/lib/brandKitPdf";

type Step = "input" | "loading" | "review" | "capture" | "done";

type ColorSwatch = { hex: string; rgb: string; role: string };

const ROLE_OPTIONS = ["Primary", "Secondary", "Accent", "Neutral", "Support"];
const IMAGERY_OPTIONS = ["clean", "warm", "bold", "editorial", "playful", "refined"] as const;

const LOADING_MESSAGES = [
  "Reading your site",
  "Pulling your colors",
  "Finding your fonts",
  "Building your kit",
];

function hexToRgbString(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return "";
  return `rgb(${r}, ${g}, ${b})`;
}

function parseHexInput(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9a-f]{3}$/i.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  if (!/^#[0-9a-f]{6}$/i.test(s)) return null;
  return s.toUpperCase();
}

function parseExtraInput(extra: string): { hexes: string[]; fonts: string[] } {
  const hexes = (extra.match(/#?[0-9a-f]{6}\b/gi) ?? [])
    .map((h) => parseHexInput(h))
    .filter((h): h is string => !!h);
  // Anything quoted or followed by "font" we treat as font hints.
  const fonts: string[] = [];
  const quoted = extra.match(/["']([^"']{2,40})["']/g) ?? [];
  for (const q of quoted) {
    fonts.push(q.replace(/["']/g, "").trim());
  }
  const fontPhrase = extra.match(/(?:font[s]?\s*[:\-]?)\s*([A-Za-z][A-Za-z0-9 ,]{1,80})/i);
  if (fontPhrase) {
    fontPhrase[1].split(",").map((f) => f.trim()).forEach((f) => {
      if (f && f.length <= 40) fonts.push(f);
    });
  }
  return { hexes: Array.from(new Set(hexes)), fonts: Array.from(new Set(fonts)) };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await fileToDataUrl(new File([blob], "logo", { type: blob.type }));
  } catch {
    return null;
  }
}

export default function BrandKit() {
  const [step, setStep] = useState<Step>("input");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // input
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const [extra, setExtra] = useState("");

  // review
  const [siteName, setSiteName] = useState("");
  const [colors, setColors] = useState<ColorSwatch[]>([]);
  const [headingFont, setHeadingFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [logoUrl, setLogoUrl] = useState<string>(""); // for display
  const [imagery, setImagery] = useState<string[]>(["clean", "warm"]);

  // capture
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const generatedPdfRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (step !== "loading") return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const id = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(id);
  }, [step]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!website.trim()) {
      toast({ title: "Add your website to continue." });
      return;
    }
    setStep("loading");
    setLoadingMsgIdx(0);

    try {
      let uploadedLogo = "";
      if (logoFile) {
        uploadedLogo = await fileToDataUrl(logoFile);
        setLogoDataUrl(uploadedLogo);
      }

      const { data, error } = await supabase.functions.invoke("extract-brand-kit", {
        body: { url: website.trim() },
      });
      if (error) throw error;

      const manual = parseExtraInput(extra);

      // Merge colors: manual first, then detected, dedupe
      const detected: string[] = Array.isArray(data?.colors) ? data.colors : [];
      const merged: string[] = [];
      [...manual.hexes, ...detected].forEach((h) => {
        const n = parseHexInput(h);
        if (n && !merged.includes(n)) merged.push(n);
      });
      const finalHexes = merged.slice(0, 6);
      const swatches: ColorSwatch[] = finalHexes.map((hex, i) => ({
        hex,
        rgb: hexToRgbString(hex),
        role: ROLE_OPTIONS[Math.min(i, ROLE_OPTIONS.length - 1)],
      }));
      // Ensure at least one swatch
      if (swatches.length === 0) {
        swatches.push({ hex: "#15171C", rgb: hexToRgbString("#15171C"), role: "Primary" });
      }
      setColors(swatches);

      const detectedFonts = data?.fonts ?? { heading: "Inter", body: "Inter" };
      setHeadingFont(manual.fonts[0] || detectedFonts.heading || "Inter");
      setBodyFont(manual.fonts[1] || detectedFonts.body || manual.fonts[0] || detectedFonts.heading || "Inter");

      setSiteName(data?.siteName || "");

      // Logo: user upload wins, else attempt to fetch detected logo into data url
      if (uploadedLogo) {
        setLogoUrl(uploadedLogo);
      } else if (data?.logo) {
        const dataUrl = await urlToDataUrl(data.logo);
        setLogoUrl(dataUrl || data.logo);
      } else {
        setLogoUrl("");
      }

      setStep("review");
    } catch (err) {
      console.error(err);
      toast({
        title: "We could not finish scanning that site.",
        description: "You can still fill in the details on the next screen.",
      });
      // graceful fallback: empty review state
      setColors([{ hex: "#15171C", rgb: hexToRgbString("#15171C"), role: "Primary" }]);
      setHeadingFont("Inter");
      setBodyFont("Inter");
      setStep("review");
    }
  }

  function updateSwatch(idx: number, patch: Partial<ColorSwatch>) {
    setColors((cs) => cs.map((c, i) => (i === idx ? { ...c, ...patch, rgb: patch.hex ? hexToRgbString(patch.hex) : c.rgb } : c)));
  }

  function addSwatch() {
    if (colors.length >= 6) return;
    setColors((cs) => [...cs, { hex: "#FF6B5C", rgb: hexToRgbString("#FF6B5C"), role: "Accent" }]);
  }

  function removeSwatch(idx: number) {
    setColors((cs) => cs.filter((_, i) => i !== idx));
  }

  function toggleImagery(word: string) {
    setImagery((arr) => {
      if (arr.includes(word)) return arr.filter((w) => w !== word);
      if (arr.length >= 3) return arr;
      return [...arr, word];
    });
  }

  async function handleReplaceLogo(file: File) {
    const data = await fileToDataUrl(file);
    setLogoUrl(data);
    setLogoDataUrl(data);
  }

  const canSend = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
    );
  }, [firstName, lastName, email]);

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    try {
      const data: BrandKitData = {
        siteName: siteName || website,
        websiteUrl: website,
        logo: logoUrl || logoDataUrl || undefined,
        colors,
        fonts: { heading: headingFont, body: bodyFont },
        imagery,
      };
      const blob = await generateBrandKitPdf(data);
      generatedPdfRef.current = blob;
      const base64 = await blobToBase64(blob);

      const { error } = await supabase.functions.invoke("send-brand-kit", {
        body: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          website_url: website.trim(),
          pdfBase64: base64,
        },
      });
      if (error) throw error;

      // trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brand-kit-${(siteName || "moxiemo").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStep("done");
    } catch (err) {
      console.error(err);
      toast({
        title: "Something blocked the send.",
        description: "Try again in a moment.",
      });
    } finally {
      setSending(false);
    }
  }

  async function handleJoinBeta() {
    try {
      const { error } = await supabase.functions.invoke("join-waitlist", {
        body: {
          name: `${firstName} ${lastName}`.trim(),
          email,
          website_url: website,
          referral_source: "brand_kit_tool",
        },
      });
      if (error) throw error;
      toast({ title: "You are on the list.", description: "We will be in touch soon." });
    } catch (err) {
      console.error(err);
      toast({ title: "Could not add you yet.", description: "Try again in a moment." });
    }
  }

  function downloadAgain() {
    if (!generatedPdfRef.current) return;
    const url = URL.createObjectURL(generatedPdfRef.current);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brand-kit-${(siteName || "moxiemo").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F5F1", color: "#15171C" }}>
      <SiteHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 w-full">
          {step === "input" && (
            <section>
              <p className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] mb-6" style={{ color: "#FF6B5C" }}>
                FREE BRAND KIT GENERATOR
              </p>
              <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-[-0.03em] mb-5">
                Your brand already has a look. Let's put it on paper.
              </h1>
              <p className="text-lg md:text-xl text-[#3c3f50] leading-relaxed mb-10 max-w-2xl">
                Enter your website. We pull your colors, your fonts, and your logo into one clean brand kit you can hand to a designer, drop into Canva, or use to keep everything you make on brand. No account needed.
              </p>

              <form onSubmit={handleStart} className="space-y-6 max-w-xl">
                <div>
                  <Label htmlFor="website" className="text-sm font-semibold">Your website</Label>
                  <Input
                    id="website"
                    type="text"
                    inputMode="url"
                    placeholder="yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    required
                    className="mt-2 h-12 bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="logo" className="text-sm font-semibold">Your logo (optional)</Label>
                  <p className="text-xs text-[#7a7e8c] mt-1">
                    Have a logo file handy? Add it and we will include it. If not, we will pull what we find.
                  </p>
                  <label
                    htmlFor="logo"
                    className="mt-2 flex items-center gap-3 h-12 px-3 rounded-md border border-input bg-white cursor-pointer hover:bg-[#fafaf7]"
                  >
                    <Upload className="h-4 w-4 text-[#7a7e8c]" />
                    <span className="text-sm text-[#3c3f50] truncate">
                      {logoFile ? logoFile.name : "Upload PNG, SVG, or JPG"}
                    </span>
                    <input
                      id="logo"
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      className="sr-only"
                      onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <div>
                  <Label htmlFor="extra" className="text-sm font-semibold">Anything else (optional)</Label>
                  <p className="text-xs text-[#7a7e8c] mt-1">
                    Know your exact brand colors or fonts? Add them and we will use yours over what we detect.
                  </p>
                  <Textarea
                    id="extra"
                    placeholder='e.g. #FF6B5C, #15171C, fonts: "Söhne", "Inter"'
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    className="mt-2 bg-white"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-8 rounded-full font-semibold text-white"
                  style={{ backgroundColor: "#FF6B5C" }}
                >
                  Build my brand kit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </section>
          )}

          {step === "loading" && (
            <section className="py-24 text-center" aria-live="polite">
              <Loader2 className="h-10 w-10 mx-auto animate-spin motion-reduce:hidden" style={{ color: "#FF6B5C" }} />
              <p className="mt-6 text-2xl md:text-3xl font-bold tracking-tight transition-opacity">
                {LOADING_MESSAGES[loadingMsgIdx]}…
              </p>
              <p className="mt-2 text-[#7a7e8c]">This usually takes a few seconds.</p>
            </section>
          )}

          {step === "review" && (
            <section>
              <p className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] mb-6" style={{ color: "#FF6B5C" }}>
                REVIEW
              </p>
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.05] tracking-[-0.03em] mb-4">
                Here's your brand kit. Make it yours.
              </h1>
              <p className="text-lg text-[#3c3f50] leading-relaxed mb-10 max-w-2xl">
                We pulled these from your site. Change anything that is not quite right before you download.
              </p>

              {/* Logo */}
              <div className="mb-10 bg-white rounded-xl border border-[#e4e5ea] p-6">
                <h2 className="text-sm font-bold tracking-wider uppercase text-[#15171C] mb-4">Logo</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="w-40 h-40 rounded-lg border border-[#e4e5ea] flex items-center justify-center bg-[#fafaf7] overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-xs text-[#7a7e8c]">No logo</span>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-[#15171C] hover:underline">
                    <Upload className="h-4 w-4" /> Replace logo
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleReplaceLogo(f);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Colors */}
              <div className="mb-10 bg-white rounded-xl border border-[#e4e5ea] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold tracking-wider uppercase text-[#15171C]">Color palette</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addSwatch}
                    disabled={colors.length >= 6}
                    className="text-[#15171C]"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add color
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {colors.map((c, i) => (
                    <div key={i} className="border border-[#e4e5ea] rounded-lg overflow-hidden bg-white">
                      <label className="block h-20 cursor-pointer relative" style={{ backgroundColor: c.hex }}>
                        <input
                          type="color"
                          value={c.hex}
                          onChange={(e) => updateSwatch(i, { hex: e.target.value.toUpperCase() })}
                          className="sr-only"
                          aria-label="Pick color"
                        />
                      </label>
                      <div className="p-3 space-y-2">
                        <select
                          value={c.role}
                          onChange={(e) => updateSwatch(i, { role: e.target.value })}
                          className="w-full text-[10px] font-bold uppercase tracking-wider bg-transparent border-0 p-0 focus:ring-0"
                          style={{ color: "#FF6B5C" }}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <Input
                          value={c.hex}
                          onChange={(e) => {
                            const n = parseHexInput(e.target.value);
                            if (n) updateSwatch(i, { hex: n });
                            else updateSwatch(i, { hex: e.target.value });
                          }}
                          className="h-8 text-sm font-semibold px-2"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#7a7e8c]">{c.rgb}</span>
                          <button
                            type="button"
                            onClick={() => removeSwatch(i)}
                            className="text-[#7a7e8c] hover:text-[#FF6B5C]"
                            aria-label="Remove color"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fonts */}
              <div className="mb-10 bg-white rounded-xl border border-[#e4e5ea] p-6">
                <h2 className="text-sm font-bold tracking-wider uppercase text-[#15171C] mb-4">Typography</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#FF6B5C" }}>Heading</Label>
                    <Input
                      value={headingFont}
                      onChange={(e) => setHeadingFont(e.target.value)}
                      className="mt-2 h-10 bg-white"
                    />
                    <p className="mt-3 text-2xl leading-tight" style={{ fontFamily: `'${headingFont}', Inter, sans-serif` }}>
                      The quick brown fox.
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#FF6B5C" }}>Body</Label>
                    <Input
                      value={bodyFont}
                      onChange={(e) => setBodyFont(e.target.value)}
                      className="mt-2 h-10 bg-white"
                    />
                    <p className="mt-3 text-sm leading-relaxed text-[#3c3f50]" style={{ fontFamily: `'${bodyFont}', Inter, sans-serif` }}>
                      Good body type is invisible. It carries the reader without asking for attention.
                    </p>
                  </div>
                </div>
              </div>

              {/* Imagery */}
              <div className="mb-10 bg-white rounded-xl border border-[#e4e5ea] p-6">
                <h2 className="text-sm font-bold tracking-wider uppercase text-[#15171C] mb-2">Imagery direction</h2>
                <p className="text-sm text-[#7a7e8c] mb-4">Pick two or three that match the visual feel you want.</p>
                <div className="flex flex-wrap gap-2">
                  {IMAGERY_OPTIONS.map((w) => {
                    const active = imagery.includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => toggleImagery(w)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                          active
                            ? "text-white border-transparent"
                            : "bg-white text-[#15171C] border-[#e4e5ea] hover:border-[#15171C]"
                        }`}
                        style={active ? { backgroundColor: "#15171C" } : undefined}
                        aria-pressed={active}
                      >
                        {active && <Check className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
                        {w}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => setStep("capture")}
                  className="h-12 px-8 rounded-full font-semibold text-white"
                  style={{ backgroundColor: "#FF6B5C" }}
                >
                  Continue to download
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </section>
          )}

          {step === "capture" && (
            <section className="max-w-xl mx-auto">
              <p className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] mb-6 text-center" style={{ color: "#FF6B5C" }}>
                ONE LAST STEP
              </p>
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.05] tracking-[-0.03em] mb-4 text-center">
                Where should we send your kit?
              </h1>
              <p className="text-lg text-[#3c3f50] leading-relaxed mb-10 text-center">
                Enter your best email to ensure your download arrives. Double-check it. This is to ensure you get your kit right away.
              </p>

              <form
                onSubmit={handleCapture}
                className="bg-white border border-[#e4e5ea] rounded-2xl p-8 shadow-sm space-y-5"
              >
                <div>
                  <Label htmlFor="first" className="text-sm font-semibold">First name</Label>
                  <Input
                    id="first"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                    className="mt-2 h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="last" className="text-sm font-semibold">Last name</Label>
                  <Input
                    id="last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                    className="mt-2 h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="mt-2 h-12"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={!canSend || sending}
                  className="w-full h-12 rounded-full font-semibold text-white"
                  style={{ backgroundColor: "#FF6B5C" }}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Building your PDF
                    </>
                  ) : (
                    "Send me my kit"
                  )}
                </Button>
                <p className="text-xs text-[#7a7e8c] text-center">
                  We will email your kit and the occasional note from MOXIEMO. Unsubscribe anytime.
                </p>
              </form>
            </section>
          )}

          {step === "done" && (
            <section className="text-center max-w-2xl mx-auto">
              <div
                className="inline-flex items-center justify-center h-14 w-14 rounded-full mb-6"
                style={{ backgroundColor: "#FF6B5C" }}
              >
                <Check className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.05] tracking-[-0.03em] mb-4">
                Done. Your kit is downloading.
              </h1>
              <p className="text-lg text-[#3c3f50] leading-relaxed mb-8">
                Check your downloads folder. Need it again? Grab it below.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={downloadAgain}
                className="rounded-full h-11 px-6 uppercase tracking-wider"
              >
                DOWNLOAD AGAIN
              </Button>

              <div
                className="mt-16 p-8 md:p-12 rounded-2xl text-left"
                style={{ backgroundColor: "#15171C", color: "#ffffff" }}
              >
                <p className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: "#FF6B5C" }}>
                  WHAT'S NEXT
                </p>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                  This is the look. MOXIEMO builds the rest.
                </h2>
                <p className="text-base md:text-lg text-[#cfd1d8] leading-relaxed mb-8">
                  Your brand kit is the surface. MOXIEMO is the strategy, the content, and the marketing that runs underneath it. We are opening a limited founding round soon. Want in early?
                </p>
                <Button
                  type="button"
                  onClick={handleJoinBeta}
                  size="lg"
                  className="h-12 px-8 rounded-full font-semibold text-white"
                  style={{ backgroundColor: "#FF6B5C" }}
                >
                  Join the Beta 2.0 list
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}