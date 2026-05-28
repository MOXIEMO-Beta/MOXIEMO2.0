import { LegalPage, LegalSection, LegalDivider, LegalList } from "@/components/LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="Effective Date: May 28, 2026 · Last Updated: May 28, 2026 · Version 1.0">
      <LegalSection heading="Issued By">
        <p>KLMG US Ltd, doing business as MOXIEMO.</p>
        <p>
          Contact:{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>
          <br />
          Platform: buildwithmoxiemo.com
        </p>
        <p>
          This Terms of Service — User Agreement (the "Agreement") is a legally binding contract between You ("User," "You," or "Your") and KLMG US Ltd, doing business as MOXIEMO ("MOXIEMO," "Company," "We," or "Us"). By accessing or using the MOXIEMO platform, website, or any related services, You agree to be bound by this Agreement in its entirety. Please read it carefully before using the Services.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="1. Description of Services">
        <p>
          MOXIEMO is an AI-powered marketing platform designed for founders, entrepreneurs, coaches, consultants, and service-based business owners. The MOXIEMO platform ("Platform" or "Sites") includes, but is not limited to:
        </p>
        <LegalList items={[
          "An AI-driven Discovery session that generates a personalized marketing strategy from Your answers",
          "A strategy dashboard containing positioning, content pillars, quarterly themes, competitive positioning, brand voice guidelines, and a 30-day content calendar",
          "A downloadable PDF strategy report branded to Your business",
          "AI-powered content generation tools for creating marketing copy, social posts, newsletters, and other content",
          "A content scheduling and publishing system, including integrations with third-party platforms",
          "Analytics, performance tracking, and campaign management tools",
          "Additional features and services as developed and released by MOXIEMO over time",
        ]} />
        <p>
          This Agreement governs Your use of all MOXIEMO Sites, Services, functionalities, features, AI tools, content, data, software, integrations, and any associated applications, whether accessed via web browser, mobile device, or any other means.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="2. Acceptance of Terms">
        <p>
          By accessing or using the Sites or Services in any way — including creating an account, entering a beta access code, clicking "Get Started," completing the Discovery session, or downloading any output — You agree to be bound by this Agreement and all policies incorporated herein by reference, including our Privacy Policy.
        </p>
        <p>
          MOXIEMO reserves the right to modify, update, or replace any part of this Agreement at any time, at its sole discretion. Changes become effective immediately upon posting to the Sites. The most current version will always reflect the date at the top of this Agreement. Your continued use of the Sites or Services following any modification constitutes Your acceptance of the updated terms. You are responsible for reviewing this Agreement periodically. If You do not agree to the modified terms, You must stop using the Services immediately.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="3. Eligibility and Account Registration">
        <p>
          <span className="text-foreground font-medium">3.1 Eligibility.</span> The Sites and Services are intended solely for individuals who are 18 years of age or older. By using the Sites, You represent and warrant that You are at least 18 years of age and have the legal capacity to enter into this Agreement. If You are accessing the Services on behalf of a business entity, You further represent that You have the authority to bind that entity to this Agreement.
        </p>
        <p>
          <span className="text-foreground font-medium">3.2 Account Creation.</span> To access certain features of the Sites You will be required to create an account ("Account"). You agree to: (1) provide true, accurate, current, and complete information during registration; (2) maintain and promptly update Your Account information to keep it accurate and complete; and (3) keep Your login credentials confidential and not share them with any third party. You are solely responsible for all activity that occurs under Your Account.
        </p>
        <p>
          MOXIEMO reserves the right to suspend or terminate any Account where there is reason to believe that the information provided is untrue, inaccurate, or incomplete, or where there has been a violation of this Agreement.
        </p>
        <p>
          <span className="text-foreground font-medium">3.3 Beta Access.</span> During the beta period, access to the Platform may be granted via a beta access code provided by MOXIEMO. Beta access codes are non-transferable and may only be used by the individual for whom they were issued. Sharing, distributing, or selling beta access codes is strictly prohibited and may result in immediate termination of access without notice or refund.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="4. Founding Member Program">
        <p>
          <span className="text-foreground font-medium">4.1 Founding Member Access.</span> MOXIEMO offers a Founding Member program to early users who join during the designated beta period. Founding Members receive free access to the Platform for as long as the Founding Member tier remains active and in good standing, subject to the terms of this Agreement and any supplementary Founding Member terms provided at sign-up.
        </p>
        <p>
          Founding Member access is provided at no cost during the beta period. MOXIEMO reserves the right to modify, limit, or discontinue the Founding Member tier at any time, with reasonable advance notice to affected users. In the event the Founding Member tier is discontinued, affected users will be offered the opportunity to transition to a paid plan at the then-current pricing.
        </p>
        <p>
          <span className="text-foreground font-medium">4.2 Founding Member Benefits.</span> Current Founding Member benefits include:
        </p>
        <LegalList items={[
          "Free forever access to the Platform (subject to Section 4.1)",
          "A personal 1:1 onboarding call with Karee Laing, Founder of MOXIEMO",
          "Direct feedback access to the product team during the first 30 days",
          "First access to new features before public release",
        ]} />
        <p>
          MOXIEMO reserves the right to modify the benefits associated with the Founding Member tier. Material reductions in benefits will be communicated to Founding Members with reasonable advance notice.
        </p>
        <p>
          <span className="text-foreground font-medium">4.3 Beta Period Conduct.</span> Founding Members and beta users acknowledge that the Platform is in active development. You may encounter bugs, incomplete features, or unexpected behavior. By participating in the beta, You agree to: (1) provide honest feedback when requested; (2) not publicly share screenshots, outputs, or details of unreleased features without MOXIEMO's prior written consent; and (3) understand that features available during beta may be modified, moved to paid tiers, or discontinued at general availability.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="5. Payments and Subscriptions">
        <p>
          <span className="text-foreground font-medium">5.1 Paid Plans.</span> MOXIEMO offers subscription-based access to the Platform in addition to the Founding Member free tier. Current paid plans include the Growth tier at $79 per month. Pricing is subject to change with advance notice to active subscribers. By subscribing to a paid plan, You authorize MOXIEMO to charge Your designated payment method on a recurring basis according to Your selected billing cycle.
        </p>
        <p>
          <span className="text-foreground font-medium">5.2 Payment Processor.</span> All payments are processed by Stripe, a third-party payment processor. By providing payment information, You agree to Stripe's terms of service. MOXIEMO does not store full credit card information. In the event of a failed payment, MOXIEMO may retry the charge and may suspend access to the Services until payment is resolved.
        </p>
        <p>
          <span className="text-foreground font-medium">5.3 Auto-Renewal.</span> All subscriptions automatically renew at the end of each billing period unless cancelled prior to the renewal date. You may cancel Your subscription at any time through Your Account settings. Cancellation takes effect at the end of the current billing period. You will retain access to the Services through the end of the paid period. No partial refunds are issued for unused portions of a billing period.
        </p>
        <p>
          <span className="text-foreground font-medium">5.4 Free Trials.</span> If MOXIEMO offers a free trial, the trial period begins on the date of sign-up. You may cancel at any time during the trial period with no charge. If You do not cancel before the trial period ends, You will be automatically charged for the applicable subscription plan. Credit card information may be required to begin a free trial.
        </p>
        <p>
          <span className="text-foreground font-medium">5.5 Refund Policy.</span> Due to the nature of MOXIEMO's AI-generated digital services and outputs, all payments are non-refundable unless explicitly stated otherwise or required by applicable law. By agreeing to these terms, You acknowledge that You understand and accept this refund policy. Any attempt to initiate a chargeback without first contacting MOXIEMO at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>{" "}
          may result in suspension of Your Account and recovery of fees associated with the chargeback process.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="6. Use of AI Services and Generated Content">
        <p>
          <span className="text-foreground font-medium">6.1 Nature of AI-Generated Outputs.</span> MOXIEMO uses artificial intelligence to generate marketing strategies, content, positioning frameworks, and related outputs based on information You provide during the Discovery session and elsewhere on the Platform ("AI Outputs"). You acknowledge and agree that:
        </p>
        <LegalList items={[
          "AI Outputs are generated algorithmically and may not always be accurate, complete, or suitable for Your specific circumstances",
          "AI Outputs are provided for informational and strategic guidance purposes only and do not constitute professional marketing, legal, financial, or business advice",
          "MOXIEMO does not guarantee that AI Outputs will achieve any specific business result, revenue target, audience growth, or marketing outcome",
          "You are solely responsible for reviewing, validating, and making decisions based on AI Outputs before acting on them",
          "The quality and relevance of AI Outputs depends substantially on the accuracy and completeness of the information You provide",
        ]} />
        <p>
          <span className="text-foreground font-medium">6.2 No Professional Advice.</span> Nothing on the Platform constitutes professional marketing, legal, financial, accounting, or business consulting advice. MOXIEMO is a software platform, not a licensed professional service. Any strategies, recommendations, or content generated by the Platform should be reviewed with qualified professionals as appropriate for Your specific situation before implementation.
        </p>
        <p>
          <span className="text-foreground font-medium">6.3 Ownership of AI Outputs.</span> Subject to Your compliance with this Agreement and payment of applicable fees, MOXIEMO grants You a non-exclusive, non-transferable license to use AI Outputs generated from Your Discovery session and Platform usage for Your own business purposes. You may not resell, redistribute, or sublicense AI Outputs to third parties without MOXIEMO's prior written consent.
        </p>
        <p>
          MOXIEMO retains the right to use anonymized, aggregated data derived from Platform usage to improve its AI models and services. No personally identifiable information or business-specific data will be shared with third parties without Your consent, as further described in our Privacy Policy.
        </p>
        <p>
          <span className="text-foreground font-medium">6.4 Your Input Data.</span> You represent and warrant that all information You provide to MOXIEMO during the Discovery session or elsewhere on the Platform: (1) is accurate and truthful to the best of Your knowledge; (2) does not infringe the intellectual property rights of any third party; (3) does not contain any confidential information belonging to others that You are not authorized to share; and (4) does not violate any applicable law or regulation.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="7. Third-Party Integrations and Publishing">
        <p>
          <span className="text-foreground font-medium">7.1 Connected Platforms.</span> MOXIEMO may offer integrations with third-party platforms including but not limited to LinkedIn, Meta (Facebook and Instagram), TikTok, Pinterest, Google Business Profile, WordPress, email service providers (including Kit, Mailchimp, Beehiiv, and ActiveCampaign), and analytics platforms including Google Analytics ("Third-Party Platforms").
        </p>
        <p>
          <span className="text-foreground font-medium">7.2 Your Responsibility for Third-Party Accounts.</span> When You connect Your Third-Party Platform accounts to MOXIEMO, You: (1) authorize MOXIEMO to access and interact with those accounts on Your behalf as directed by You; (2) remain solely responsible for all content published through those accounts via MOXIEMO; (3) represent that You have the right and authority to connect those accounts and publish content through them; and (4) agree to comply with the terms of service of each Third-Party Platform.
        </p>
        <p>
          MOXIEMO is not responsible for any content published in error, account suspensions, policy violations, or other consequences arising from Your use of Third-Party Platform integrations.
        </p>
        <p>
          <span className="text-foreground font-medium">7.3 Third-Party Platform Availability.</span> Third-Party Platform integrations depend on APIs and permissions granted by those platforms, which are outside MOXIEMO's control. MOXIEMO does not guarantee the continuous availability of any integration and is not liable for any disruption, deprecation, or change in functionality caused by Third-Party Platform policy changes or API modifications.
        </p>
        <p>
          <span className="text-foreground font-medium">7.4 Links to External Websites.</span> The Platform may contain links to external websites for convenience. MOXIEMO is not responsible for the content, accuracy, or practices of any linked external site and does not endorse any product, service, or opinion expressed therein.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="8. Intellectual Property">
        <p>
          <span className="text-foreground font-medium">8.1 MOXIEMO Intellectual Property.</span> All elements of the MOXIEMO Platform, including but not limited to software, code, interfaces, design, graphics, text, templates, frameworks, methodologies, trademarks, logos, and trade names, are the exclusive property of KLMG US Ltd and are protected by applicable intellectual property laws. MOXIEMO grants You a limited, non-exclusive, non-transferable, revocable license to use the Platform solely for Your own business purposes in accordance with this Agreement. You may not copy, modify, reverse engineer, create derivative works from, or sublicense any part of the Platform.
        </p>
        <p>
          <span className="text-foreground font-medium">8.2 Your Content.</span> You retain ownership of all original content You create or upload to the Platform ("User Content"). By submitting User Content to MOXIEMO, You grant MOXIEMO a limited, non-exclusive, royalty-free license to process, store, and use Your User Content solely to provide the Services to You. MOXIEMO will not sell or share Your User Content with third parties except as described in our Privacy Policy or as required by law.
        </p>
        <p>
          <span className="text-foreground font-medium">8.3 Feedback.</span> If You provide MOXIEMO with feedback, suggestions, or ideas about the Platform ("Feedback"), You grant MOXIEMO a perpetual, irrevocable, royalty-free license to use that Feedback in any manner, including to improve the Platform, without any obligation to compensate You.
        </p>
        <p>
          <span className="text-foreground font-medium">8.4 Copyright Infringement.</span> If You believe any content on the Platform infringes Your copyright, please contact MOXIEMO at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>{" "}
          with: (1) a description of the copyrighted work; (2) the URL or location of the allegedly infringing material; (3) Your contact information; and (4) a statement of good faith belief that the use is unauthorized. MOXIEMO will respond to valid notices in accordance with applicable law.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="9. User Conduct and Prohibited Use">
        <p>
          <span className="text-foreground font-medium">9.1 Acceptable Use.</span> You agree to use the Platform only for lawful purposes and in accordance with this Agreement. You are solely responsible for all activity that occurs under Your Account.
        </p>
        <p>
          <span className="text-foreground font-medium">9.2 Prohibited Activities.</span> You agree not to:
        </p>
        <LegalList items={[
          "Use the Platform to create, distribute, or promote content that is illegal, defamatory, fraudulent, misleading, harassing, hateful, or in violation of any applicable law",
          "Attempt to gain unauthorized access to any part of the Platform, other user accounts, or MOXIEMO's systems",
          "Use automated tools, bots, scrapers, or other means to extract data from the Platform without MOXIEMO's prior written consent",
          "Reverse engineer, decompile, or attempt to discover the source code of the Platform or its AI models",
          "Use the Platform to generate content that infringes the intellectual property rights of any third party",
          "Share, resell, or sublicense Your Account, access credentials, or Platform outputs for commercial gain without MOXIEMO's prior written consent",
          "Interfere with or disrupt the security, integrity, or performance of the Platform or its infrastructure",
          "Use the Platform in any way that could expose MOXIEMO or its users to legal liability",
          "Impersonate any person or entity or falsely represent Your affiliation with any person or entity",
        ]} />
        <p>
          MOXIEMO reserves the right to investigate violations and to cooperate with law enforcement authorities in prosecuting users involved in illegal activity.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="10. Privacy and Data">
        <p>
          Your privacy is important to MOXIEMO. Our Privacy Policy, incorporated by reference into this Agreement, describes how we collect, use, store, and protect Your personal information and business data. By using the Platform, You consent to the data practices described in our Privacy Policy. Please review it carefully at buildwithmoxiemo.com/privacy.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="11. Disclaimers and Limitation of Liability">
        <p>
          <span className="text-foreground font-medium">11.1 No Guaranteed Outcomes.</span> MOXIEMO does not guarantee that use of the Platform will result in any specific business outcome, revenue increase, audience growth, lead generation result, or marketing performance. Marketing results depend on numerous factors outside MOXIEMO's control, including Your industry, competition, market conditions, execution quality, and personal effort. You agree not to hold MOXIEMO responsible for any outcome, positive or negative, resulting from Your use of the Platform or implementation of AI-generated strategies.
        </p>
        <p>
          <span className="text-foreground font-medium">11.2 Platform Provided "As Is".</span>
        </p>
        <p className="uppercase text-[15px]">
          The Platform and all Services are provided "as is" and "as available" without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, completeness, non-infringement, or uninterrupted availability. MOXIEMO does not warrant that the Platform will be error-free, secure, or free of viruses or other harmful components.
        </p>
        <p>
          <span className="text-foreground font-medium">11.3 Limitation of Liability.</span>
        </p>
        <p className="uppercase text-[15px]">
          To the maximum extent permitted by applicable law, in no event shall MOXIEMO, its officers, directors, employees, agents, or assigns be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of data, loss of business opportunity, or reputational harm, arising out of or related to Your use of the Platform, even if MOXIEMO has been advised of the possibility of such damages. MOXIEMO's total cumulative liability to You for any claim arising out of or related to this Agreement shall not exceed the total fees You paid to MOXIEMO in the twelve (12) months preceding the claim.
        </p>
        <p>
          <span className="text-foreground font-medium">11.4 Indemnification.</span> You agree to indemnify, defend, and hold harmless MOXIEMO, KLMG US Ltd, and their respective officers, directors, employees, agents, successors, and assigns from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with: (1) Your use of the Platform or Services; (2) Your violation of this Agreement; (3) Your violation of any third-party rights, including intellectual property rights; (4) content You publish through the Platform; or (5) Your violation of any applicable law.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="12. Termination and Access Restriction">
        <p>
          <span className="text-foreground font-medium">12.1 Termination by You.</span> You may terminate Your Account at any time by cancelling Your subscription through Your Account settings and ceasing use of the Platform. Termination does not entitle You to a refund of any fees paid.
        </p>
        <p>
          <span className="text-foreground font-medium">12.2 Termination by MOXIEMO.</span> MOXIEMO reserves the right to suspend or terminate Your Account and access to the Services, with or without notice, at its sole discretion, for any reason, including but not limited to: (1) violation of this Agreement; (2) non-payment of fees; (3) conduct that MOXIEMO determines to be harmful to other users or the Platform; or (4) extended periods of inactivity.
        </p>
        <p>
          <span className="text-foreground font-medium">12.3 Effect of Termination.</span> Upon termination of Your Account: (1) Your right to access the Platform immediately ceases; (2) MOXIEMO may delete Your Account data in accordance with our data retention policies and Privacy Policy; (3) any licenses granted to You under this Agreement are immediately revoked; and (4) provisions of this Agreement that by their nature should survive termination shall continue in full force and effect, including Sections 8, 11, 12, 13, and 14.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="13. Communications">
        <p>
          By creating an Account and agreeing to this Agreement, You consent to receive communications from MOXIEMO including: (1) transactional emails related to Your Account, subscription, and use of the Platform; (2) product updates, feature announcements, and platform news; and (3) marketing communications, subject to Your opt-in preferences and applicable law.
        </p>
        <p>
          You may opt out of marketing communications at any time by clicking the unsubscribe link in any email or by contacting MOXIEMO at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>. Transactional and account-related communications cannot be opted out of while Your Account remains active.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="14. Testimonials and Case Studies">
        <p>
          MOXIEMO may request Your permission to share a testimonial, case study, or account of Your experience with the Platform for marketing and promotional purposes. You have the absolute right to decline. If You provide a testimonial or participate in a case study, You grant MOXIEMO a non-exclusive, royalty-free license to use Your name, business name, and testimonial content in its marketing materials. You may revoke this consent at any time by contacting{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="15. General Provisions">
        <p>
          <span className="text-foreground font-medium">15.1 Governing Law.</span> This Agreement is governed by and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions. Any disputes arising under this Agreement that are not resolved by arbitration shall be subject to the exclusive jurisdiction of the state and federal courts located in Harris County, Texas.
        </p>
        <p>
          <span className="text-foreground font-medium">15.2 Dispute Resolution and Arbitration.</span> Any dispute, claim, or controversy arising out of or relating to this Agreement or Your use of the Platform shall first be attempted to be resolved informally by contacting MOXIEMO at{" "}
          <a className="text-foreground underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>. If the dispute is not resolved within 30 days, it shall be submitted to binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules. Arbitration shall be conducted on an individual basis; class action arbitration is not permitted. The arbitrator's decision shall be final and binding.
        </p>
        <p>
          <span className="text-foreground font-medium">15.3 Severability.</span> If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable.
        </p>
        <p>
          <span className="text-foreground font-medium">15.4 Entire Agreement.</span> This Agreement, together with the Privacy Policy and any additional terms applicable to specific features or programs, constitutes the entire agreement between You and MOXIEMO with respect to the Platform and supersedes all prior or contemporaneous agreements, representations, and understandings. No waiver of any provision of this Agreement shall be effective unless in writing and signed by an authorized representative of MOXIEMO.
        </p>
        <p>
          <span className="text-foreground font-medium">15.5 Assignment.</span> You may not assign or transfer Your rights or obligations under this Agreement without MOXIEMO's prior written consent. MOXIEMO may freely assign this Agreement, including in connection with a merger, acquisition, or sale of all or substantially all of its assets, without notice or consent.
        </p>
        <p>
          <span className="text-foreground font-medium">15.6 No Waiver.</span> MOXIEMO's failure to enforce any right or provision of this Agreement shall not constitute a waiver of that right or provision. Any waiver must be in writing and signed by an authorized representative of MOXIEMO.
        </p>
        <p>
          <span className="text-foreground font-medium">15.7 Force Majeure.</span> MOXIEMO shall not be liable for any delay or failure to perform its obligations under this Agreement due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, government actions, cyberattacks, third-party platform outages, or internet infrastructure failures.
        </p>
      </LegalSection>
      <LegalDivider />

      <LegalSection heading="16. Contact">
        <p>If You have any questions, concerns, or complaints about this Agreement or the MOXIEMO Platform, please contact us at:</p>
        <p className="text-foreground">
          <span className="font-medium">KLMG US Ltd d/b/a MOXIEMO</span>
          <br />
          Email: <a className="underline" href="mailto:hello@buildwithmoxiemo.com">hello@buildwithmoxiemo.com</a>
          <br />
          Website: buildwithmoxiemo.com
          <br />
          Houston, Texas, United States
        </p>
        <p>All correspondence will be directed to the email address associated with Your Account. It is Your responsibility to keep Your contact information current.</p>
        <p className="text-foreground font-medium uppercase text-[15px]">
          By using the MOXIEMO Platform or clicking "Get Started," You acknowledge that You have read, understood, and agree to be bound by these Terms of Service.
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
