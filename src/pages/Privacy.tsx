import { Link } from "react-router-dom";
import { MoxieLogo } from "@/components/MoxieLogo";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><MoxieLogo /></Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-5xl mb-3">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12">Last updated: May 1, 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-2xl mb-2">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">We collect information you provide during signup and use of the platform, including name, email, business information, and content you create.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use your information to provide and improve MOXIE's services, personalize your experience, and communicate with you about your account.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">3. Data Storage</h2>
            <p className="text-muted-foreground leading-relaxed">Your data is stored securely using Supabase infrastructure with row-level security enabled.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">4. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">We use Resend for email delivery, Anthropic for AI features, and LinkedIn/Meta APIs for social publishing. Each has their own privacy policies.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">5. Data Deletion</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can request deletion of your data at any time by contacting{" "}
              <a className="text-foreground underline" href="mailto:questions@buildwithmoxie.co">questions@buildwithmoxie.co</a>{" "}
              or visiting{" "}
              <a className="text-foreground underline" href="https://buildwithmoxie.co/data-deletion" target="_blank" rel="noreferrer">buildwithmoxie.co/data-deletion</a>.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">6. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">We use essential cookies for authentication only.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">7. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              <a className="text-foreground underline" href="mailto:questions@buildwithmoxie.co">questions@buildwithmoxie.co</a>
              <br />
              KLMG-US Ltd · Houston, Texas
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}