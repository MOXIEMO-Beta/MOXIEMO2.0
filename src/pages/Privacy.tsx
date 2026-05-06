import { LegalPage, LegalSection, LegalDivider, LegalList } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="Last updated: May 4, 2026">
      <LegalSection heading="Introduction">
        <p>
          MOXIEMO ("we," "our," or "us") is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, disclose, and safeguard your information when
          you use our platform at buildwithmoxiemo.com and any related services (collectively,
          the "Platform"). Please read this policy carefully. By using MOXIEMO, you agree to
          the practices described here.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Information We Collect">
        <p className="font-medium text-foreground">Information you provide directly:</p>
        <LegalList items={[
          "Account information: name, email address, company name, website, and role when you create an account or join the waitlist",
          "Discovery responses: your answers to the MOXIEMO Discovery conversation — including your business positioning, ideal client, pain points, voice, and marketing goals",
          "Content you create: posts, emails, campaigns, and other content generated or saved within the platform",
          "Communications: messages you send us via email or the feedback form",
        ]} />
        <p className="font-medium text-foreground">Information collected automatically:</p>
        <LegalList items={[
          "Usage data: pages visited, features used, time spent, clicks, and interactions within the platform",
          "Device and browser information: IP address, browser type, operating system, and device identifiers",
          "Cookies and similar tracking technologies: we use cookies to maintain your session, remember your preferences, and understand how the platform is used",
        ]} />
        <p className="font-medium text-foreground">Information from third parties:</p>
        <LegalList items={[
          "If you connect third-party accounts (LinkedIn, Facebook, Instagram), we receive limited data from those platforms as authorized by you and their terms of service",
        ]} />
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="How We Use Your Information">
        <p>We use the information we collect to:</p>
        <LegalList items={[
          "Create and maintain your account",
          "Run the MOXIEMO Discovery process and generate your marketing strategy",
          "Generate content, campaigns, and recommendations personalized to your business",
          "Improve and develop the platform and our AI models*",
          "Send you product updates, onboarding communications, and marketing emails (you may opt out at any time)",
          "Respond to your support requests and feedback",
          "Comply with legal obligations and enforce our Terms of Service",
        ]} />
        <p className="text-[15px] italic">
          *Important note on AI training: We do not use your Discovery responses, strategy
          data, or personally identifiable business information to train third-party AI
          models without your explicit consent. Content generation is processed through the
          Anthropic API, which has its own data handling practices available at
          anthropic.com/privacy.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="How We Share Your Information">
        <p>We do not sell your personal information. We share data only in these limited circumstances:</p>
        <LegalList items={[
          <><span className="text-foreground font-medium">Service providers:</span> We share data with trusted vendors who help us operate the platform, including Supabase (database), Anthropic (AI processing), and Stripe (payments). These providers are contractually bound to protect your data.</>,
          <><span className="text-foreground font-medium">Legal requirements:</span> We may disclose information if required by law, court order, or government authority.</>,
          <><span className="text-foreground font-medium">Business transfers:</span> If MOXIEMO is acquired or merges with another company, your data may be transferred as part of that transaction. We will notify you before this occurs.</>,
          <><span className="text-foreground font-medium">With your consent:</span> We may share information in other ways if you explicitly authorize it.</>,
        ]} />
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Data Retention">
        <p>
          We retain your account data and Discovery responses for as long as your account is
          active. If you delete your account, we will delete or anonymize your personal data
          within 30 days, except where retention is required by law (such as billing records,
          which we retain for 7 years).
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Your Rights">
        <p>Depending on your location, you may have the following rights:</p>
        <LegalList items={[
          <><span className="text-foreground font-medium">Access:</span> Request a copy of the personal data we hold about you</>,
          <><span className="text-foreground font-medium">Correction:</span> Request correction of inaccurate data</>,
          <><span className="text-foreground font-medium">Deletion:</span> Request deletion of your data (see our Data Deletion page for instructions)</>,
          <><span className="text-foreground font-medium">Portability:</span> Request your data in a machine-readable format</>,
          <><span className="text-foreground font-medium">Opt-out:</span> Unsubscribe from marketing emails at any time using the link in any email we send</>,
        ]} />
        <p>
          To exercise any of these rights, contact us at:{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>
        </p>
        <p>We will respond to all requests within 30 days.</p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Cookies">
        <p>
          We use essential cookies to keep you logged in and remember your preferences. We
          use analytics cookies to understand how the platform is used. You can control
          cookies through your browser settings, though disabling certain cookies may affect
          platform functionality.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Children's Privacy">
        <p>
          MOXIEMO is not intended for users under the age of 18. We do not knowingly collect
          personal information from minors. If we discover we have collected data from a
          minor, we will delete it immediately.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Security">
        <p>
          We implement industry-standard security measures including encryption in transit
          (TLS), encrypted storage, and access controls. However, no system is completely
          secure. We encourage you to use a strong, unique password for your MOXIEMO account.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by email or by posting a notice on the platform. Your continued use of
          MOXIEMO after changes take effect constitutes acceptance of the updated policy.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Contact Us">
        <p>If you have questions about this Privacy Policy, contact us at:</p>
        <p className="text-foreground">
          MOXIEMO /{" "}
          <a className="underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a> /
          buildwithmoxiemo.com
        </p>
      </LegalSection>
    </LegalPage>
  );
}