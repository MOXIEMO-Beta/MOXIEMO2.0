import { LegalPage, LegalSection, LegalDivider, LegalList } from "@/components/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="Last updated: May 4, 2026">
      <LegalSection heading="Agreement to Terms">
        <p>
          These Terms of Service ("Terms") govern your access to and use of the MOXIEMO
          platform operated by KLMG-US ("MOXIEMO," "we," "our," or "us"). By creating an
          account or using the platform, you agree to these Terms. If you do not agree, do
          not use MOXIEMO.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Eligibility">
        <p>
          You must be at least 18 years old and capable of entering a legally binding
          contract to use MOXIEMO. By using the platform, you represent that you meet these
          requirements.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Your Account">
        <p>
          You are responsible for maintaining the confidentiality of your login credentials
          and for all activity that occurs under your account. Notify us immediately at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>{" "}
          if you suspect unauthorized access to your account.
        </p>
        <p>You agree not to:</p>
        <LegalList items={[
          "Share your account credentials with others",
          "Create multiple accounts to circumvent restrictions",
          "Use another person's account without permission",
        ]} />
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Platform License">
        <p>
          Subject to these Terms, MOXIEMO grants you a limited, non-exclusive, non-transferable,
          revocable license to access and use the platform for your internal business
          purposes. This license does not include the right to:
        </p>
        <LegalList items={[
          "Resell or sublicense access to the platform",
          "Reverse engineer, decompile, or extract our source code",
          "Use the platform to build a competing product",
          "Scrape, crawl, or systematically extract platform data",
        ]} />
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Your Content">
        <p>
          You retain full ownership of the content you create using MOXIEMO — your Discovery
          responses, generated posts, emails, campaigns, and strategies. By using the
          platform, you grant MOXIEMO a limited license to store, process, and display your
          content solely to provide the service to you.
        </p>
        <p>
          You represent that your content does not violate any third-party rights, applicable
          laws, or these Terms.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Acceptable Use">
        <p>You agree not to use MOXIEMO to:</p>
        <LegalList items={[
          "Generate spam, misleading content, or content that violates applicable laws",
          "Harass, defame, or harm any person or group",
          "Violate any intellectual property rights",
          "Circumvent any security or access controls",
          "Transmit malware, viruses, or harmful code",
        ]} />
        <p>
          We reserve the right to suspend or terminate accounts that violate these rules
          without prior notice.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="AI-Generated Content">
        <p>
          MOXIEMO uses AI to generate marketing content, strategies, and recommendations. You
          acknowledge that:
        </p>
        <LegalList items={[
          "AI-generated content may not always be accurate, complete, or appropriate for your specific situation",
          "You are responsible for reviewing and approving all content before publishing or using it",
          "MOXIEMO does not guarantee specific results from using AI-generated content",
          "You should not rely on AI-generated content as legal, financial, or professional advice",
        ]} />
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Subscription and Billing">
        <p>
          Paid plans are billed monthly or annually as selected. By providing payment
          information, you authorize us to charge your payment method on a recurring basis.
        </p>
        <p>
          <span className="text-foreground font-medium">Cancellation:</span> You may cancel
          your subscription at any time. Your access continues until the end of the current
          billing period. We do not offer refunds for partial periods except where required
          by law.
        </p>
        <p>
          <span className="text-foreground font-medium">Founding Member Program:</span>{" "}
          Founding members who receive free access as part of our beta program do so under
          the terms communicated at signup. We reserve the right to modify founding member
          terms with 30 days' notice.
        </p>
        <p>
          <span className="text-foreground font-medium">Price changes:</span> We will provide
          30 days' notice before any price increases. Your continued use after the notice
          period constitutes acceptance of the new pricing.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Intellectual Property">
        <p>
          The MOXIEMO platform, including its design, code, brand, AI systems, and methodology,
          is owned by KLMG-US and protected by intellectual property laws. Nothing in these
          Terms transfers ownership of our intellectual property to you.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Disclaimers">
        <p className="uppercase text-[15px]">
          The platform is provided "as is" without warranties of any kind, express or
          implied. We do not warrant that the platform will be uninterrupted, error-free, or
          free of harmful components. We do not guarantee any specific marketing results from
          use of the platform.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Limitation of Liability">
        <p className="uppercase text-[15px]">
          To the maximum extent permitted by law, MOXIEMO shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising from your use of
          the platform. Our total liability to you shall not exceed the amount you paid to us
          in the 12 months preceding the claim.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Indemnification">
        <p>
          You agree to indemnify and hold harmless MOXIEMO and its officers, directors,
          employees, and agents from any claims, damages, or expenses (including attorney's
          fees) arising from your use of the platform, your content, or your violation of
          these Terms.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Termination">
        <p>
          We may suspend or terminate your account at any time for violation of these Terms.
          You may terminate your account by contacting us at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>.
          Upon termination, your license to use the platform ends immediately and we will
          handle your data per our Privacy Policy.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Governing Law">
        <p>
          These Terms are governed by the laws of the State of Texas, United States, without
          regard to conflict of law principles. Any disputes shall be resolved in the courts
          of Harris County, Texas.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Changes to Terms">
        <p>
          We may update these Terms at any time. We will notify you of material changes by
          email at least 14 days before they take effect. Continued use of the platform after
          changes take effect constitutes acceptance.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Contact">
        <p>Questions about these Terms? Contact us at:</p>
        <p className="text-foreground">
          <a className="underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a> /
          buildwithmoxiemo.com
        </p>
      </LegalSection>
    </LegalPage>
  );
}