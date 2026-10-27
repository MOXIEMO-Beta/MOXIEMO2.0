import { LegalPage, LegalSection, LegalDivider, LegalList } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="Effective Date: May 28, 2026 · Last Updated: May 28, 2026 · Version 1.0">
      <LegalSection heading="Issued By">
        <p>KLMG US Ltd, doing business as MOXIEMO.</p>
        <p>
          Contact:{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>
          <br />
          Platform: buildwithmoxiemo.com
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="1. Introduction and Scope">
        <p>
          KLMG US Ltd, doing business as MOXIEMO ("MOXIEMO," "We," "Us," or "Our"), is committed to protecting your privacy and handling your personal information with transparency and care. This Privacy Policy explains how we collect, use, store, share, and protect your information when you use the MOXIEMO platform at buildwithmoxiemo.com and any related services, applications, or tools (collectively, the "Platform" or "Sites").
        </p>
        <p>
          This Privacy Policy applies to all users of the MOXIEMO Platform, including Founding Members, beta users, paid subscribers, and visitors to the Sites. It does not apply to the data practices of third-party platforms or services that MOXIEMO may integrate with, link to, or partner with. We encourage You to review the privacy policies of any third-party platforms You connect to through MOXIEMO.
        </p>
        <p>
          <span className="text-foreground font-medium">1.1 Consent.</span> By accessing or using the MOXIEMO Platform, creating an account, completing the Discovery session, or otherwise interacting with the Sites, You consent to the collection, use, and sharing practices described in this Privacy Policy, as updated from time to time. If You do not agree with this Privacy Policy, please stop using the Platform immediately.
        </p>
        <p>
          <span className="text-foreground font-medium">1.2 What This Policy Does Not Cover.</span> This Privacy Policy does not address the data practices of: (1) third-party platforms You connect to through MOXIEMO integrations (such as LinkedIn, Meta, TikTok, Google, or email service providers); (2) third-party websites that may be linked to from the Platform; or (3) payment processors operating under their own privacy frameworks. Each of these parties operates under their own privacy policies, which We encourage You to review.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="2. Information We Collect">
        <p>
          We collect information in three ways: information You provide directly to us, information collected automatically when You use the Platform, and information received from third-party services You connect.
        </p>
        <p>
          <span className="text-foreground font-medium">2.1 Information You Provide Directly.</span>
        </p>
        <p>
          <span className="text-foreground font-medium">Account and Registration Information.</span> When You create an account, join the waitlist, or sign up as a Founding Member, we collect:
        </p>
        <LegalList items={[
          "Full name",
          "Email address",
          "Company or business name",
          "Website URL",
          "Role or title",
          "Beta access code (if applicable)",
          "Password (stored in encrypted form — we never see your plain-text password)",
        ]} />
        <p>
          <span className="text-foreground font-medium">Discovery Session Responses.</span> The MOXIEMO Discovery session is the core of the Platform. When You complete Discovery, we collect and store your responses, which may include sensitive business information such as:
        </p>
        <LegalList items={[
          "Your business positioning and value proposition",
          "Your ideal client profile and target audience",
          "Your revenue goals and business objectives",
          "Your brand voice, communication style, and differentiators",
          "Your current marketing channels, tools, and performance data",
          "Any documents or URLs You upload or provide during Discovery",
        ]} />
        <p className="italic">
          Your Discovery data is used exclusively to generate your marketing strategy and power Platform features. It is never sold or shared with third parties for their own marketing purposes.
        </p>
        <p>
          <span className="text-foreground font-medium">Content You Create.</span> Content You generate, save, edit, or publish through the Platform, including social media posts, email drafts, campaign copy, and strategy documents.
        </p>
        <p>
          <span className="text-foreground font-medium">Communications.</span> Messages You send us via email, the feedback form, or support channels. We retain these communications to respond to Your requests and improve our services.
        </p>
        <p>
          <span className="text-foreground font-medium">Payment Information.</span> Billing name, address, and payment card details submitted during subscription purchases. Payment data is processed and stored by Stripe, our third-party payment processor. MOXIEMO does not store full payment card numbers.
        </p>
        <p>
          <span className="text-foreground font-medium">2.2 Information Collected Automatically.</span>
        </p>
        <p>
          <span className="text-foreground font-medium">Usage Data.</span> When You use the Platform, we automatically collect information about how You interact with it, including pages visited, features used, buttons clicked, time spent on each page, content generated, and session duration.
        </p>
        <p>
          <span className="text-foreground font-medium">Device and Technical Information.</span> We collect device and browser information including: IP address, browser type and version, operating system, device type and identifiers, screen resolution, referring URLs, and language settings.
        </p>
        <p>
          <span className="text-foreground font-medium">Cookies and Similar Technologies.</span> We use cookies (small text files stored on Your device) and similar tracking technologies including pixel tags and web beacons. Cookies we use include:
        </p>
        <LegalList items={[
          "Essential cookies: Required for the Platform to function. These keep You logged in and maintain Your session. These cannot be disabled without affecting Platform functionality.",
          "Preference cookies: Remember Your settings and preferences across sessions.",
          "Analytics cookies: With Your permission, Microsoft Clarity records clicks, scrolls, page movement, and device and usage data for heatmaps and session replays that help us improve the site.",
          "Marketing cookies: With Your permission, site data may be shared with Microsoft for advertising and campaign measurement.",
        ]} />
        <p>
          You can control cookie settings through Your browser. Note that disabling certain cookies may limit Your ability to use some features of the Platform. We may also use pixel tags and web beacons in emails and on the Platform to understand whether messages have been opened and to track engagement.
        </p>
        <p>
          <span className="text-foreground font-medium">2.3 Information from Third-Party Integrations.</span> If You connect third-party accounts to MOXIEMO (such as LinkedIn, Facebook, Instagram, Google, or email service providers), we receive limited data from those platforms as authorized by You and subject to their respective terms of service and privacy policies. This may include basic profile information, page or account identifiers, and performance data from content published through those connections.
        </p>
        <p>
          You control which third-party accounts You connect and may disconnect them at any time through Your Account settings. Disconnecting a third-party account removes MOXIEMO's ongoing access to that platform but does not affect data we have already collected.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="3. How We Use Your Information">
        <p>We use the information we collect for the following purposes:</p>
        <p>
          <span className="text-foreground font-medium">3.1 Providing and Personalizing the Platform.</span>
        </p>
        <LegalList items={[
          "Creating and maintaining Your Account",
          "Running the Discovery session and generating Your personalized marketing strategy",
          "Generating AI-powered content, campaigns, and strategic recommendations based on Your business data",
          "Personalizing Your Platform experience based on Your preferences and usage patterns",
          "Enabling content scheduling, publishing, and integration features",
        ]} />
        <p>
          <span className="text-foreground font-medium">3.2 Communications.</span>
        </p>
        <LegalList items={[
          "Sending transactional emails related to Your Account, subscription, and Platform activity",
          "Sending onboarding communications and product updates",
          "Responding to Your support requests, feedback, and inquiries",
          "Sending marketing and promotional communications (only with Your consent and subject to opt-out rights)",
          "SMS communications where You have opted in (see Section 7)",
        ]} />
        <p>
          <span className="text-foreground font-medium">3.3 Platform Improvement.</span>
        </p>
        <LegalList items={[
          "Analyzing usage patterns to improve Platform features, performance, and user experience",
          "Identifying and fixing bugs and technical issues",
          "Conducting research and analytics to develop new features",
        ]} />
        <p>
          <span className="text-foreground font-medium">3.4 AI Model Use.</span> MOXIEMO uses artificial intelligence to generate strategies, content, and recommendations. With respect to AI processing:
        </p>
        <LegalList items={[
          "Your Discovery responses and strategy data are processed through the Anthropic API to generate Your marketing strategy. Anthropic's data handling practices are available at anthropic.com/privacy.",
          "We do not use Your Discovery responses, strategy data, or personally identifiable business information to train third-party AI models without Your explicit written consent.",
          "Anonymized, aggregated usage data (with no personally identifiable information) may be used internally to improve MOXIEMO's own AI systems and models.",
        ]} />
        <p>
          <span className="text-foreground font-medium">3.5 Legal and Security.</span>
        </p>
        <LegalList items={[
          "Complying with applicable laws, regulations, and legal processes",
          "Enforcing our Terms of Service and other policies",
          "Detecting, investigating, and preventing fraudulent activity, security breaches, and abuse",
          "Protecting the rights, property, and safety of MOXIEMO, our users, and the public",
        ]} />
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="4. How We Share Your Information">
        <p>We do not sell, rent, or trade Your personal information. We share data only in the following limited circumstances:</p>
        <p>
          <span className="text-foreground font-medium">4.1 Service Providers.</span> We share data with trusted third-party vendors who help us operate the Platform. These providers are contractually bound to protect Your data and may only use it to perform services on our behalf. Current key service providers include:
        </p>
        <LegalList items={[
          "Supabase — database hosting and authentication (supabase.com/privacy)",
          "Anthropic — AI content generation and strategy processing (anthropic.com/privacy)",
          "Stripe — payment processing (stripe.com/privacy)",
          "Email service providers — for sending transactional and marketing emails",
          "Analytics providers — for understanding Platform usage",
        ]} />
        <p>
          We may update our list of service providers as the Platform evolves. Material changes to key AI processing partners will be communicated to users.
        </p>
        <p>
          <span className="text-foreground font-medium">4.2 Third-Party Integrations at Your Direction.</span> When You connect third-party platforms (such as LinkedIn or Mailchimp) and use MOXIEMO to publish content or sync data, information You have chosen to share is transmitted to those platforms at Your direction. This sharing is governed by Your agreements with those third parties.
        </p>
        <p>
          <span className="text-foreground font-medium">4.3 Legal Requirements.</span> We may disclose Your information if we have a good-faith belief that disclosure is reasonably necessary to: (1) comply with a law, regulation, legal process, or enforceable government request; (2) enforce our Terms of Service; (3) detect, prevent, or address fraud, security issues, or illegal activity; or (4) protect the rights, property, or safety of MOXIEMO, our users, or the public.
        </p>
        <p>
          <span className="text-foreground font-medium">4.4 Business Transfers.</span> If MOXIEMO is involved in a merger, acquisition, asset sale, or other business transfer, Your information may be transferred as part of that transaction. We will notify You by email and/or a prominent notice on the Platform at least 30 days before Your data becomes subject to a different privacy policy as a result of such a transfer.
        </p>
        <p>
          <span className="text-foreground font-medium">4.5 With Your Consent.</span> We may share Your information in other ways if You explicitly authorize it, such as in case studies or testimonials as described in the Terms of Service.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="5. Data Retention">
        <p>
          We retain Your personal information for as long as Your Account is active and for a reasonable period thereafter to fulfill the purposes described in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. Specific retention periods:
        </p>
        <LegalList items={[
          "Account data and Discovery responses: Retained for the duration of Your Account. Deleted or anonymized within 30 days of Account deletion, unless required by law.",
          "Billing and payment records: Retained for 7 years as required by tax and accounting regulations.",
          "Communications and support records: Retained for 3 years or as required by applicable law.",
          "Usage and analytics data: Retained in aggregated, anonymized form indefinitely for Platform improvement purposes.",
        ]} />
        <p>
          You may request deletion of Your data at any time (see Section 6). In some cases, we may be required to retain certain data by law or for legitimate business purposes, in which case we will inform You of the specific retention requirement.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="6. Your Rights and Choices">
        <p>
          Depending on Your location and applicable law, You have the following rights regarding Your personal information. To exercise any of these rights, contact us at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>. We will respond to all requests within 30 days.
        </p>
        <p>
          <span className="text-foreground font-medium">6.1 Right to Access.</span> You have the right to request a copy of the personal data we hold about You, including Your account information, Discovery responses, and activity data.
        </p>
        <p>
          <span className="text-foreground font-medium">6.2 Right to Correction.</span> You have the right to request correction of inaccurate or incomplete personal data. You can update most account information directly through Your Account settings.
        </p>
        <p>
          <span className="text-foreground font-medium">6.3 Right to Deletion.</span> You have the right to request deletion of Your personal data. To request deletion, contact us at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a> or use the account deletion feature in Your Account settings. We will process deletion requests within 30 days. Note that we may retain certain data where required by law (such as billing records) or for legitimate business purposes, in which case we will inform You.
        </p>
        <p>
          <span className="text-foreground font-medium">6.4 Right to Data Portability.</span> You have the right to request Your data in a structured, commonly used, machine-readable format. We can provide Your Discovery responses, strategy outputs, and account data in a portable format upon request.
        </p>
        <p>
          <span className="text-foreground font-medium">6.5 Right to Opt Out of Marketing.</span> You may opt out of marketing communications at any time by: (1) clicking the unsubscribe link in any marketing email; (2) replying STOP to any SMS message; or (3) contacting us at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>. Opting out of marketing does not affect transactional communications related to Your Account.
        </p>
        <p>
          <span className="text-foreground font-medium">6.6 California Residents — Additional Rights.</span> If You are a California resident, You have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), including the right to: (1) know what personal information is collected and how it is used; (2) opt out of the sale or sharing of personal information (MOXIEMO does not sell personal information); (3) non-discrimination for exercising Your privacy rights; and (4) limit use of sensitive personal information. To exercise California-specific rights, contact{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>.
        </p>
        <p>
          <span className="text-foreground font-medium">6.7 Other State Privacy Rights.</span> Users in Virginia, Colorado, Connecticut, Texas, and other states with applicable privacy laws have similar rights regarding their personal data. Contact us at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a> to exercise any state-specific privacy rights.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="7. Email and SMS Communications">
        <p>
          <span className="text-foreground font-medium">7.1 Email Communications.</span> By creating an Account with MOXIEMO, You consent to receive transactional emails including account confirmations, subscription receipts, security notifications, and platform updates. You may also opt in to receive marketing emails including product news, feature announcements, and promotional content. You may opt out of marketing emails at any time using the unsubscribe link in any email or by contacting{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>.
        </p>
        <p>
          If You opt out of marketing emails, You will continue to receive transactional emails that are necessary for the operation of Your Account and the delivery of Services.
        </p>
        <p>
          <span className="text-foreground font-medium">7.2 SMS Communications.</span> MOXIEMO may offer SMS communications for account alerts, onboarding support, and platform updates. SMS communications are opt-in only. By opting in to SMS communications, You agree to receive text messages from MOXIEMO at the mobile number You provide.
        </p>
        <LegalList items={[
          "Message and data rates may apply depending on Your carrier and plan.",
          "Message frequency may vary.",
          "To opt out of SMS messages, reply STOP to any message from us. You will receive a confirmation and no further messages will be sent.",
          "To get help with SMS communications, reply HELP or contact us at hello@buildwithmoxiemo.com.",
          "We will not share Your SMS opt-in status with any third party for purposes unrelated to delivering the SMS service You have requested.",
        ]} />
        <p className="italic">
          MOXIEMO will not use SMS to send unsolicited marketing messages. SMS will be used only for service-related communications to users who have explicitly opted in.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="8. Cookies and Tracking Technologies">
        <p>
          Strictly necessary cookies are always on. Preferences, analytics, and marketing are off until You choose to allow them. Microsoft Clarity loads only when You allow analytics. Analytics consent permits usage measurement and session replays; marketing consent separately permits Microsoft to use site data for advertising. Learn more at <a className="text-foreground underline" href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">Microsoft Privacy Statement</a>.
        </p>
        <p>
          Open Cookie settings in the footer to review or withdraw Your choices at any time. Withdrawing analytics stops Clarity and removes its _clck and _clsk cookies. When Your browser sends Global Privacy Control and You have no saved choice, we turn off optional categories automatically. You can explicitly change these choices in the preferences panel.
        </p>
        <p>
          We store Your choices locally for up to six months under notice version 2026-11-01. We also keep an append-only consent record containing a random visitor identifier, notice version, category choices, Global Privacy Control signal, choice source, page path, and time. This record does not contain Your IP address and preserves earlier choices when You later withdraw permission. An updated notice version requires a new choice. Accepting this Privacy Policy or browsing the site does not grant permission for optional cookies.
        </p>
        <p>
          We use cookies and similar technologies including pixel tags and web beacons to operate the Platform, understand how it is used, and improve Your experience. A summary of the technologies we use:
        </p>
        <LegalList items={[
          "Cookies: Small text files stored on Your device that allow the Platform to recognize You across sessions, maintain Your login state, and remember Your preferences.",
          "Pixel tags: Transparent images embedded in web pages or emails that signal when a page or email has been opened or an action has been taken.",
          "Web beacons: Similar to pixel tags, used to track email open rates and link click rates in our communications.",
        ]} />
        <p>
          You can control cookies through Your browser's privacy settings. Disabling essential cookies will impair Platform functionality, including Your ability to remain logged in. Disabling analytics or marketing cookies will not affect Your core use of the Platform.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="9. Data Security">
        <p>
          We implement industry-standard security measures to protect Your personal information from unauthorized access, use, disclosure, alteration, and destruction. Security measures include:
        </p>
        <LegalList items={[
          "Encryption in transit using TLS (Transport Layer Security) for all data transmitted between Your device and our servers",
          "Encrypted database storage for sensitive data including Discovery responses and account credentials",
          "Row-level security policies on our database to ensure users can only access their own data",
          "Access controls limiting employee and vendor access to personal data on a need-to-know basis",
          "Regular security reviews and vulnerability assessments",
        ]} />
        <p>
          No system is completely secure. While we take data security seriously and implement robust protections, we cannot guarantee absolute security. We encourage You to use a strong, unique password for Your MOXIEMO Account and to contact us immediately at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a> if You suspect unauthorized access to Your Account.
        </p>
        <p>
          <span className="text-foreground font-medium">9.1 Data Breach Notification.</span> In the event of a data breach that affects Your personal information, MOXIEMO will notify affected users via in-platform notification and/or email within seven (7) business days of discovering and confirming the breach, to the extent required and as permitted by applicable law. Notification will include: (1) a description of the nature of the breach; (2) the categories of personal data involved; (3) the steps we have taken or are taking to address the breach; and (4) recommended steps You can take to protect yourself.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="10. Children's Privacy">
        <p>
          The MOXIEMO Platform is intended for use by individuals who are 18 years of age or older. We do not knowingly collect, solicit, or process personal information from individuals under the age of 18. If You are a parent or guardian and believe that your child has provided personal information to MOXIEMO without your consent, please contact us immediately at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>. We will delete any confirmed data collected from a minor promptly.
        </p>
        <p>
          As of the effective date of this Privacy Policy, MOXIEMO does not knowingly "sell" or "share" (as those terms are defined in applicable privacy law) the personal information of individuals under 18 years of age.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="11. CAN-SPAM Compliance">
        <p>
          MOXIEMO complies with the CAN-SPAM Act. In accordance with CAN-SPAM requirements, all commercial email communications from MOXIEMO will:
        </p>
        <LegalList items={[
          "Use truthful, accurate subject lines and sender identification",
          "Be clearly identified as advertising or promotional communication where applicable",
          "Include our physical business address: KLMG US Ltd, Houston, Texas, United States",
          "Honor opt-out and unsubscribe requests within 10 business days of receipt",
          "Include a clear, easy-to-use unsubscribe mechanism in every marketing email",
          "Not use false or deceptive routing information or email headers",
        ]} />
        <p>
          To unsubscribe from MOXIEMO marketing emails, use the unsubscribe link at the bottom of any email or contact us at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>. We will process all unsubscribe requests promptly.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="12. Fair Information Practices">
        <p>
          MOXIEMO is committed to the principles of fair information practices. In the event of a data breach, we will notify affected users as described in Section 9.1. We also adhere to the Individual Redress Principle: You have the right to legally pursue enforceable rights against data collectors and processors who fail to adhere to applicable law. This includes the right to seek recourse through courts or government agencies for investigation and prosecution of non-compliance by data processors.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="13. Third-Party Platforms and Links">
        <p>
          The Platform may contain links to external websites, and MOXIEMO may integrate with third-party platforms at Your direction. MOXIEMO is not responsible for the privacy practices or content of any third-party site or service. This Privacy Policy applies only to data collected by MOXIEMO through the Platform. We strongly encourage You to review the privacy policies of:
        </p>
        <LegalList items={[
          "Any third-party platform You connect to through MOXIEMO integrations (LinkedIn, Meta, Google, TikTok, email service providers)",
          "Anthropic (anthropic.com/privacy) — which processes Your Discovery responses for AI strategy generation",
          "Stripe (stripe.com/privacy) — which processes Your payment information",
          "Supabase (supabase.com/privacy) — which hosts our database infrastructure",
        ]} />
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="14. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, the Platform, or applicable law. When we make material changes, we will: (1) post the updated policy on the Platform with a new "Last Updated" date; (2) notify You by email at the address associated with Your Account; and (3) where required by law, obtain Your consent to the updated terms.
        </p>
        <p>
          Your continued use of the Platform after the effective date of any updated Privacy Policy constitutes Your acceptance of the updated terms. If You do not agree with the updated terms, You must stop using the Platform.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="15. Contact Us">
        <p>
          If You have any questions, concerns, or requests regarding this Privacy Policy or MOXIEMO's data practices, please contact us:
        </p>
        <p className="text-foreground">
          <span className="font-medium">KLMG US Ltd d/b/a MOXIEMO</span>
          <br />
          Privacy inquiries:{" "}
          <a className="underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>
          <br />
          Platform: buildwithmoxiemo.com
          <br />
          Mailing address: Houston, Texas, United States
        </p>
        <p>
          We will respond to all privacy-related inquiries within 30 days. For data deletion requests or to exercise any rights described in Section 6, please include "Privacy Request" in the subject line of Your email.
        </p>
        <p className="text-foreground font-medium uppercase text-[15px]">
          By using the MOXIEMO Platform, You acknowledge that You have read and understood this Privacy Policy and consent to the collection, use, and sharing of Your information as described herein.
        </p>
        <p>
          Effective Date: May 28, 2026
          <br />
          Last Updated: May 28, 2026
          <br />
          Version: 1.0
        </p>
      </LegalSection>
    </LegalPage>
  );
}
