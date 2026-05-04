import { LegalPage, LegalSection, LegalDivider, LegalList } from "@/components/LegalPage";

export default function DataDeletion() {
  return (
    <LegalPage title="Data Deletion Request" lastUpdated="Last updated: May 4, 2026">
      <LegalSection heading="Your Right to Delete Your Data">
        <p>
          You have the right to request deletion of your personal data from the MOXIE
          platform at any time. This page explains what gets deleted, what we are required to
          retain, and how to submit a request.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="What Gets Deleted">
        <p>When you submit a data deletion request, we will permanently delete:</p>
        <LegalList items={[
          "Your account profile (name, email, company, role)",
          "Your MOXIE Discovery responses and conversation history",
          "Your generated marketing strategy",
          "All content you created (posts, emails, campaigns, drafts)",
          "Your marketing calendar and planner data",
          "Any connected social account authorizations",
          "Your subscriber list data (if applicable)",
        ]} />
        <p>
          Deletion is permanent and cannot be undone. We recommend exporting any content you
          want to keep before submitting a request.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="What We Retain">
        <p>We are legally required to retain certain records even after account deletion:</p>
        <LegalList items={[
          "Billing and payment records (retained for 7 years per tax law)",
          "Records of legal requests or disputes involving your account",
          "Anonymized, aggregated usage data that cannot identify you",
        ]} />
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="How to Submit a Request">
        <p>
          <span className="text-foreground font-medium">Option 1 — From within your account:</span>
          <br />
          Go to Settings → Account → Delete Account. This will immediately begin the deletion
          process.
        </p>
        <p>
          <span className="text-foreground font-medium">Option 2 — By email:</span>
          <br />
          Send a request to{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxie.co">hello@buildwithmoxie.co</a>{" "}
          with the subject line: "Data Deletion Request"
        </p>
        <p>Include in your email:</p>
        <LegalList items={[
          "The email address associated with your MOXIE account",
          "Your full name",
          "A brief statement confirming you want your data permanently deleted",
        ]} />
        <p>We will verify your identity before processing the request.</p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Processing Time">
        <p>
          We will confirm receipt of your request within 3 business days. Deletion will be
          completed within 30 days of verification. We will send you a confirmation email
          when deletion is complete.
        </p>
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Connected Third-Party Accounts">
        <p>
          If you connected LinkedIn, Facebook, or Instagram to MOXIE, we will remove all
          stored authorizations and tokens for those accounts. You should also revoke MOXIE's
          access directly from each platform's settings to ensure complete disconnection:
        </p>
        <LegalList items={[
          <><span className="text-foreground font-medium">LinkedIn:</span> Settings → Data Privacy → Permitted Services</>,
          <><span className="text-foreground font-medium">Facebook:</span> Settings → Security → Apps and Websites</>,
          <><span className="text-foreground font-medium">Instagram:</span> Settings → Security → Apps and Websites</>,
        ]} />
      </LegalSection>
      <LegalDivider />
      <LegalSection heading="Questions">
        <p>
          If you have questions about the data deletion process, contact us at:{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxie.co">hello@buildwithmoxie.co</a>
        </p>
        <p>We are committed to responding within 3 business days.</p>
      </LegalSection>
    </LegalPage>
  );
}