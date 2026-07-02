import React from "react";
import { H1, H3, P } from "@/components/ui/typography";
import SimpleHeader from "@/components/blocks/SimpleHeader";

export default function TermsPage() {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-full flex-col overflow-y-auto bg-background">
      <SimpleHeader showLanguageSwitcher={false} />
      <div className="relative mx-auto my-6 flex min-w-0 max-w-3xl flex-col justify-center p-4 text-justify [overflow-wrap:anywhere] lg:p-0">
        <H1 className="mb-8 text-center text-3xl text-slate-900">
          Terms and Conditions of Scavenger AI GmbH
        </H1>
        <div className="space-y-8">
          <section>
            <H3 className="mb-2 font-bold text-slate-800">1. Scope</H3>
            <P className="text-slate-700">
              These Terms and Conditions (hereinafter &quot;Terms&quot;) apply
              to all contracts between Scavenger AI GmbH, Alt-Heddernheim 13,
              60439 Frankfurt am Main, Germany (hereinafter &quot;Scavenger
              AI&quot;) and the users of the application available at{" "}
              <a
                className="text-primary hover:underline"
                href=" http://app.scavenger-ai.com/"
              >
                http://app.scavenger-ai.com/
              </a>{" "}
              (hereinafter &quot;Application&quot;). By registering and using
              the Application, the user accepts these Terms in their current
              version.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              2. Service Description
            </H3>
            <P className="text-slate-700">
              The Scavenger AI Application allows corporate customers
              (hereinafter &quot;Customers&quot;) to upload or connect their
              data and perform AI-supported data analysis. There is a limited
              free version of the Application available to normal users as well.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              3. Registration and User Account
            </H3>
            <P className="text-slate-700">
              (1) To use the Application, users must register and create a user
              account. (2) Registration is available for both corporate
              customers and normal users. (3) The user is obligated to provide
              truthful and complete information during registration.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              4. Usage Rights and Intellectual Property
            </H3>
            <P className="text-slate-700">
              (1) All rights to the contents of the Scavenger AI Application are
              reserved. (2) Scavenger AI grants the user a non-exclusive,
              non-transferable, and limited right to use the Application for the
              duration of this contract.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              5. User Obligations
            </H3>
            <P className="text-slate-700">
              (1) Users are required to use only new or up-to-date devices to
              achieve correct results with the Application. (2) Users must
              verify the results provided by the Application, as the Application
              can make mistakes. (3) This software is provided for informational
              and facilitative purposes only. It is not intended to replace
              professional business advice or judgment. Users are advised to
              exercise their own discretion and seek independent expert
              consultation where necessary. Users are responsible for verifying
              the relevance and accuracy of the information in the context of
              their specific business circumstances.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">6. User Content</H3>
            <P className="text-slate-700">
              (1) Users can generate content through the Application,
              particularly through the chat function. (2) The user grants
              Scavenger AI the right to store, process, and use the generated
              content as necessary to provide the contractual services.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              7. Permissible Use
            </H3>
            <P className="text-slate-700">
              (1) The user agrees to use the Application only within the
              framework of applicable laws and these Terms. (2) Prohibited uses
              include, but are not limited to: - Using the Application to
              distribute illegal, offensive, or harmful content. - Attempting to
              disrupt or damage the Application or its underlying
              infrastructure. - Unauthorized use of the Application, including
              unauthorized access or accounts.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              8. Liability and Warranty
            </H3>
            <P className="text-slate-700">
              (1) Scavenger AI is liable without limitation only for intent and
              gross negligence. (2) For slight negligence, Scavenger AI is
              liable only for the breach of essential contractual obligations
              (cardinal obligations). In such cases, liability is limited to the
              typical, foreseeable damage. (3) Users are obligated to verify the
              results provided by the Application and are responsible for the
              final decision made based on the Application.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">9. Payment Terms</H3>
            <P className="text-slate-700">
              (1) Payments for paid versions of the Application are processed
              via our external payment service provider, Stripe Payments Europe,
              Ltd. (&quot;Stripe&quot;). By making a payment, the user agrees
              that the necessary payment and billing information will be
              transmitted to Stripe for the purpose of processing the
              transaction.
            </P>
            <P className="text-slate-700">
              (2) Scavenger AI does not store full credit card details. Stripe
              may transfer, process, and store personal data outside the
              European Union under appropriate safeguards in compliance with
              GDPR.
            </P>
            <P className="text-slate-700">
              (3) The user agrees to comply with Stripe’s Terms of Service and
              Privacy Policy in addition to these Terms.
            </P>
            <P className="text-slate-700">
              (4) Unless otherwise agreed, all fees are due immediately and will
              be charged through the payment method provided by the user.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              10. Data Protection
            </H3>
            <P className="text-slate-700">
              Information on data protection is provided in the privacy policy
              available on the Application&apos;s website.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              11. Applicable Law
            </H3>
            <P className="text-slate-700">
              All disputes arising from or in connection with these Terms are
              subject to German law, excluding the United Nations Convention on
              Contracts for the International Sale of Goods (CISG).
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              12. Severability Clause
            </H3>
            <P className="text-slate-700">
              Should any provision of these Terms be or become invalid or
              unenforceable, the validity of the remaining provisions shall not
              be affected. The invalid or unenforceable provision shall be
              replaced by the statutory provisions.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">13. Publicity</H3>
            <P className="text-slate-700">
              Scavenger AI reserves the right to mention the name of the company
              and its use of the Application for marketing purposes if the user
              registers with a company email address (e.g.,
              mike.john@apple.com).
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              14. Changes to the Terms
            </H3>
            <P className="text-slate-700">
              Scavenger AI reserves the right to change these Terms at any time
              with effect for the future. Changes will be communicated to users
              in a timely manner before they take effect.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              15. Service Availability
            </H3>
            <P className="text-slate-700">
              (1) Scavenger AI will make reasonable efforts to ensure the
              availability of the Application. However, temporary disruptions or
              interruptions may occur due to maintenance, updates, or technical
              issues. (2) Scavenger AI does not guarantee uninterrupted
              availability and reserves the right to modify or discontinue the
              service at any time without prior notice.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">16. Termination</H3>
            <P className="text-slate-700">
              (1) Users can terminate their accounts at any time by following
              the instructions in their account settings. (2) Scavenger AI
              reserves the right to terminate or suspend access to the
              Application for any user who violates these Terms or engages in
              prohibited use.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              17. Copyright notice
            </H3>
            <P className="text-slate-700">
              Scavenger uses various open-source software tools to enhance its
              functionality and provide the best possible user experience:
              Numpy, Pandas, LangChain, Matplotlib, Statsmodels, Scikit-learn,
              LightGBM, FastAPI, Psycopg, Dotenv-python, Ag-grid.
            </P>
            <P className="text-slate-700">
              Scavenger acknowledges and appreciates the efforts of the
              open-source community and adheres to the respective licenses for
              each software tool used. For any further inquiries regarding the
              use of these tools, please refer to the official license
              documentation provided by the respective contributors.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              18. Newsletter and Communications
            </H3>
            <P className="text-slate-700">
              (1) By registering an account, the user agrees to receive
              newsletters and other communications from Scavenger AI to the
              email address provided during registration.
            </P>
            <P className="text-slate-700">
              (2) These communications may include updates, promotional offers,
              and information about the Application and related services.
            </P>
            <P className="text-slate-700">
              (3) Users can opt out of receiving newsletters and promotional
              communications at any time by selecting the &quot;opt-out&quot;
              option provided in each email or by adjusting their communication
              preferences in their account settings.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              19. Support and Contact
            </H3>
            <P className="text-slate-700">
              For support and other inquiries, users can contact Scavenger AI
              via the contact information provided on the Application&apos;s
              website.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              20. Analytics and Tracking
            </H3>
            <P className="text-slate-700">
              (1) The Application uses PostHog, a third-party analytics service,
              to collect and analyze usage data to improve user experience and
              Application functionality.
            </P>
            <P className="text-slate-700">
              (2) PostHog may collect information such as:
            </P>
            <ul className="mb-2 list-disc space-y-2 pl-8 text-xs text-slate-700">
              <li>Usage patterns and interactions with the Application</li>
              <li>
                Technical information (browser type, device information, IP
                address)
              </li>
              <li className="text-xs">Feature usage and performance metrics</li>
            </ul>
            <P className="text-slate-700">
              (3) This data is processed in accordance with our Privacy Policy
              and is used solely to enhance the Application&apos;s performance
              and user experience.
            </P>
            <P className="text-slate-700">
              (4) Users can opt out of analytics tracking through their browser
              settings.
            </P>
          </section>
        </div>
      </div>
    </div>
  );
}
