import { Link } from "react-router-dom";
import { MoxieLogo } from "@/components/MoxieLogo";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><MoxieLogo /></Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-5xl mb-3">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">Last updated: May 1, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="font-display text-2xl mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">By accessing MOXIE, you agree to these terms.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">MOXIE is an AI-powered marketing platform for expertise-based founders.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">You are responsible for maintaining the security of your account credentials.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to misuse the platform or use it for unlawful purposes.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">Content you create using MOXIE remains yours. MOXIE's platform, technology, and brand are owned by KLMG-US Ltd.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">MOXIE is provided "as is." We are not liable for indirect or consequential damages.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">7. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">We may update these terms with notice to users.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-2">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              <a className="text-foreground underline" href="mailto:questions@buildwithmoxie.co">questions@buildwithmoxie.co</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}