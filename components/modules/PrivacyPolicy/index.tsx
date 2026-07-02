import React from "react";

import { H1, H3, H4, P } from "@/components/ui/typography";
import Link from "next/link";
import SimpleHeader from "@/components/blocks/SimpleHeader";

export default function PrivacyPolicyPage() {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-full flex-col overflow-y-auto bg-background">
      <SimpleHeader showLanguageSwitcher={false} />
      <div className="relative mx-auto my-6 flex min-w-0 max-w-3xl flex-col justify-center p-4 text-justify [overflow-wrap:anywhere] lg:p-0">
        <H1 className="mb-8 text-center text-3xl text-slate-900">
          Scavenger Privacy Policy
        </H1>
        <div className="space-y-8">
          <section>
            <H3 className="mb-2 font-bold text-primary">1. Introduction</H3>
            <P className="text-slate-700">
              In the following, we provide information about the collection of
              personal data when using:
              <ul className="mt-2 list-none py-5 pl-8">
                <li>our platform app.scavenger</li>
                <li>our profiles in social media.</li>
              </ul>
              Personal data is any data that can be related to a specific
              natural person, such as their name or IP address.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              1.1. Contact details
            </H3>
            <P className="text-slate-700">
              The controller within the meaning of Art. 4 para. 7 EU General
              Data Protection Regulation (GDPR) is Scavenger AI GmbH,
              Thurn-und-Taxis-Platz 6, 60313 Frankfurt am Main, Germany, email:
              support@scavenger-ai.com. We are legally represented by Felix
              Beissel, Maximilian Hahnenkamp.
            </P>
            <P className="mt-2 text-slate-700">
              Our data protection officer can be reached via heyData GmbH,
              Schützenstraße 5, 10117 Berlin,{" "}
              <Link
                href="https://www.heydata.eu"
                className="text-primary hover:underline"
              >
                www.heydata.eu
              </Link>
              , E-Mail:{" "}
              <Link
                href="mailto:datenschutz@heydata.eu"
                className="text-primary hover:underline"
              >
                datenschutz@heydata.eu
              </Link>
              .
            </P>
            <P className="mt-2 text-slate-700">
              Please note that if we are acting as a data processor, this
              privacy policy does not apply. In that case, our customer will be
              the controller.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              1.2. Scope of data processing, processing purposes and legal bases
            </H3>
            <P className="text-slate-700">
              We detail the scope of data processing, processing purposes and
              legal bases below. In principle, the following come into
              consideration as the legal basis for data processing:
              <ul className="mt-2 list-disc pl-5">
                <li>
                  Art. 6 para. 1 s. 1 lit. a GDPR serves as our legal basis for
                  processing operations for which we obtain consent.
                </li>
                <li>
                  Art. 6 para. 1 s. 1 lit. b GDPR is the legal basis insofar as
                  the processing of personal data is necessary for the
                  performance of a contract, e.g. if a site visitor purchases a
                  product from us or we perform a service for him. This legal
                  basis also applies to processing that is necessary for
                  pre-contractual measures, such as in the case of inquiries
                  about our products or services.
                </li>
                <li>
                  Art. 6 para. 1 s. 1 lit. c GDPR applies if we fulfill a legal
                  obligation by processing personal data, as may be the case,
                  for example, in tax law.
                </li>
                <li>
                  Art. 6 para. 1 s. 1 lit. f GDPR serves as the legal basis when
                  we can rely on legitimate interests to process personal data,
                  e.g. for cookies that are necessary for the technical
                  operation of our website.
                </li>
              </ul>
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              1.3. Data processing outside the EEA
            </H3>
            <P className="text-slate-700">
              Insofar as we transfer data to service providers or other third
              parties outside the EEA, the security of the data during the
              transfer is guaranteed by adequacy decisions of the EU Commission,
              insofar as they exist (e.g. for Great Britain, Canada and Israel)
              (Art. 45 para. 3 GDPR).
            </P>
            <P className="mt-2 text-slate-700">
              In the case of data transfer to service providers in the USA, the
              legal basis for the data transfer is an adequacy decision of the
              EU Commission if the service provider has also certified itself
              under the EU US Data Privacy Framework.
            </P>
            <P className="mt-2 text-slate-700">
              In other cases (e.g. if no adequacy decision exists), the legal
              basis for the data transfer are usually, i.e. unless we indicate
              otherwise, standard contractual clauses. These are a set of rules
              adopted by the EU Commission and are part of the contract with the
              respective third party. According to Art. 46 para. 2 lit. b GDPR,
              they ensure the security of the data transfer. Many of the
              providers have given contractual guarantees that go beyond the
              standard contractual clauses to protect the data. These include,
              for example, guarantees regarding the encryption of data or
              regarding an obligation on the part of the third party to notify
              data subjects if law enforcement agencies wish to access the
              respective data.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              1.4. Storage duration
            </H3>
            <P className="text-slate-700">
              Unless expressly stated in this privacy policy, the data stored by
              us will be deleted as soon as they are no longer required for
              their intended purpose and no legal obligations to retain data
              conflict with the deletion. If the data are not deleted because
              they are required for other and legally permissible purposes,
              their processing is restricted, i.e. the data are blocked and not
              processed for other purposes. This applies, for example, to data
              that must be retained for commercial or tax law reasons.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              1.5. Rights of data subjects
            </H3>
            <P className="text-slate-700">
              Data subjects have the following rights against us with regard to
              their personal data:
              <ul className="mt-2 list-disc pl-5">
                <li>Right of access,</li>
                <li>Right to correction or deletion,</li>
                <li>Right to limit processing,</li>
                <li>Right to object to the processing,</li>
                <li>Right to data transferability,</li>
                <li>Right to revoke a given consent at any time.</li>
              </ul>
            </P>
            <P className="mt-2 text-slate-700">
              Data subjects also have the right to complain to a data protection
              supervisory authority about the processing of their personal data.
              Contact details of the data protection supervisory authorities are
              available at{" "}
              <Link
                href="https://www.bfdi.bund.de/EN/Service/Anschriften/Laender/Laender-node.html"
                className="text-primary hover:underline"
              >
                https://www.bfdi.bund.de/EN/Service/Anschriften/Laender/Laender-node.html
              </Link>
              .
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              1.6. Obligation to provide data
            </H3>
            <P className="text-slate-700">
              Within the scope of the business or other relationship, customers,
              prospective customers or third parties need to provide us with
              personal data that is necessary for the establishment, execution
              and termination of a business or other relationship or that we are
              legally obliged to collect. Without this data, we will generally
              have to refuse to conclude the contract or to provide a service or
              will no longer be able to perform an existing contract or other
              relationship.
            </P>
            <P className="mt-2 text-slate-700">
              Mandatory data are marked as such.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              1.7. No automatic decision making in individual cases
            </H3>
            <P className="text-slate-700">
              As a matter of principle, we do not use a fully automated
              decision-making process in accordance with article 22 GDPR to
              establish and implement the business or other relationship. Should
              we use these procedures in individual cases, we will inform of
              this separately if this is required by law.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              1.8. Making contact
            </H3>
            <P className="text-slate-700">
              When contacting us, e.g. by e-mail or telephone, the data provided
              to us (e.g. names and e-mail addresses) will be stored by us in
              order to answer questions. The legal basis for the processing is
              our legitimate interest (Art. 6 para. 1 s. 1 lit. f GDPR) to
              answer inquiries directed to us. We delete the data accruing in
              this context after the storage is no longer necessary or restrict
              the processing if there are legal retention obligations.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-slate-800">
              1.9. Customer surveys
            </H3>
            <P className="text-slate-700">
              From time to time, we conduct customer surveys to get to know our
              customers and their wishes better. In doing so, we collect the
              data requested in each case. It is our legitimate interest to get
              to know our customers and their wishes better, so that the legal
              basis for the associated data processing is Art. 6 para. 1 s. 1
              lit f GDPR. We delete the data when the results of the surveys
              have been evaluated.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-primary">2. Newsletter</H3>
            <P className="text-slate-700">
              Interested parties have the option to subscribe to a free
              newsletter. We process the data provided during registration
              exclusively for sending the newsletter. Subscription takes place
              by selecting the corresponding field on our website, by ticking
              the corresponding field in a paper document or by another clear
              action, whereby interested parties declare their consent to the
              processing of their data, so that the legal basis is Art. 6 para.
              p. 1 lit. a GDPR. Consent can be revoked at any time, e.g. by
              clicking the corresponding link in the newsletter or notifying our
              e-mail address given above. The processing of the data until
              revocation remains lawful even in the event of revocation.
            </P>
            <P className="mt-2 text-slate-700">
              We send newsletters with the tool HubSpot of the provider HubSpot,
              Inc., 25 1st Street Cambridge, MA 0214, USA (privacy policy:{" "}
              <Link
                href="https://legal.hubspot.com/privacy-policy"
                className="text-primary hover:underline"
              >
                https://legal.hubspot.com/privacy-policy
              </Link>
              ). The provider processes content, usage, meta/communication data
              and contact data in the process in the EU.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-primary">
              3. Data processing on our website
            </H3>
            <H3 className="mb-2 mt-4 font-semibold text-slate-800">
              3.1. Notice for website visitors from Germany
            </H3>
            <P className="text-slate-700">
              Our website stores information in the terminal equipment of
              website visitors (e.g. cookies) or accesses information that is
              already stored in the terminal equipment (e.g. IP addresses). What
              information this is in detail can be found in the following
              sections.
            </P>
            <P className="mt-2 text-slate-700">
              This storage and access is based on the following provisions:
              <ul className="mt-2 list-disc pl-5">
                <li>
                  Insofar as this storage or access is absolutely necessary for
                  us to provide the service of our website expressly requested
                  by website visitors (e.g., to carry out a chatbot used by the
                  website visitor or to ensure the IT security of our website),
                  it is carried out on the basis of Section 25 para. 2 no. 2 of
                  the German Telecommunications Digital Services Data Protection
                  Law (Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz),
                  &quot;TDDDG&quot;).
                </li>
                <li>
                  Otherwise, this storage or access takes place on the basis of
                  the website visitor&apos;s consent (Section 25 para. 1 TDDDG).
                </li>
              </ul>
            </P>
            <P className="mt-2 text-slate-700">
              The subsequent data processing is carried out in accordance with
              the following sections and on the basis of the provisions of the
              GDPR.
            </P>

            <H3 className="mb-2 mt-4 font-semibold text-slate-800">
              3.2. Informative use of our website
            </H3>
            <P className="text-slate-700">
              During the informative use of the website, i.e. when site visitors
              do not separately transmit information to us, we collect the
              personal data that the browser transmits to our server in order to
              ensure the stability and security of our website. This is our
              legitimate interest, so that the legal basis is Art. 6 para. 1 s.
              1 lit. f GDPR.
            </P>
            <P className="text-slate-700">
              These data are:
              <ul className="mt-2 list-disc pl-5">
                <li>IP address</li>
                <li>Date and time of the request</li>
                <li>Time zone difference to Greenwich Mean Time (GMT)</li>
                <li>Content of the request (specific page)</li>
                <li>Access status/HTTP status code</li>
                <li>Amount of data transferred in each case</li>
                <li>Website from which the request comes</li>
                <li>Browser</li>
                <li>Operating system and its interface</li>
                <li>Language and version of the browser software.</li>
              </ul>
            </P>
            <P className="text-slate-700">This data is also stored in</P>
          </section>
          <H3 className="mb-2 mt-4 font-semibold text-slate-800">
            3.3. Web hosting and provision of the website
          </H3>
          <P className="text-slate-700">
            Our website is hosted by Vercel. The provider is Vercel Inc., 340 S
            Lemon Ave Unit 4133 Walnut, CA, USA. In doing so, the provider
            processes the personal data transmitted via the website, e.g.
            content, usage, meta/communication data or contact data in the USA.
            Further information can be found in the provider&apos;s privacy
            policy at{" "}
            <Link
              href="https://vercel.com/legal/privacy-policy"
              className="text-primary hover:underline"
            >
              https://vercel.com/legal/privacy-policy
            </Link>
            .
          </P>
          <P className="text-slate-700">
            It is our legitimate interest to provide a website, so the legal
            basis of the described data processing is Art. 6 para. 1 s. 1 lit. f
            GDPR.
          </P>
          <P className="text-slate-700">
            The legal basis of the transfer to a country outside the EEA are
            standard contractual clauses. The security of the data transferred
            to the third country (i.e. a country outside the EEA) is guaranteed
            by standard data protection clauses (Art. 46 para. 2 lit. c GDPR)
            adopted by the EU Commission in accordance with the examination
            procedure under Art. 93 para. 2 of the GDPR, which we have agreed to
            with the provider.
          </P>
          <P className="text-slate-700">
            We use the content delivery network Vercel for our website. The
            provider is Vercel Inc., 340 S Lemon Ave Unit 4133 Walnut, CA, USA.
            The provider thereby processes the personal data transmitted via the
            website, e.g. content, usage, meta/communication data or contact
            data in the USA. Further information can be found in the
            provider&apos;s privacy policy at{" "}
            <Link
              href="https://vercel.com/legal/privacy-policy"
              className="text-primary hover:underline"
            >
              https://vercel.com/legal/privacy-policy
            </Link>
            .
          </P>
          <P className="text-slate-700">
            We have a legitimate interest in using sufficient storage and
            delivery capacity to ensure optimal data throughput even during
            large peak loads. Therefore, the legal basis of the described data
            processing is Art. 6 para. 1 s. 1 lit. f GDPR.
          </P>
          <P className="text-slate-700">
            Legal basis of the transfer to a country outside the EEA are
            standard contractual clauses. The security of the data transferred
            to the third country (i.e. a country outside the EEA) is guaranteed
            by standard data protection clauses (Art. 46 para. 2 lit. c GDPR)
            adopted by the EU Commission in accordance with the examination
            procedure under Art. 93 para. 2 of the GDPR, which we have agreed to
            with the provider.
          </P>

          <H3 className="mb-2 mt-4 font-semibold text-slate-800">
            3.4. Contact form
          </H3>
          <P className="text-slate-700">
            When contacting us via the contact form on our website, we store the
            data requested there and the content of the message. The legal basis
            for the processing is our legitimate interest in answering inquiries
            directed to us. The legal basis for the processing is therefore Art.
            6 para. 1 s. 1 lit. f GDPR. We delete the data accruing in this
            context after the storage is no longer necessary or restrict the
            processing if there are legal retention obligations.
          </P>

          <H3 className="mb-2 mt-4 font-semibold text-slate-800">
            3.5. Vacant positions
          </H3>
          <P className="text-slate-700">
            We publish positions that are vacant in our company on our website,
            on pages linked to the website or on third-party websites.
          </P>
          <P className="text-slate-700">
            The processing of the data provided as part of the application is
            carried out for the purpose of implementing the application process.
            Insofar as this is necessary for our decision to establish an
            employment relationship, the legal basis is Art. 88 para. GDPR in
            conjunction with Sec. 26 para. 1 of the German Data Protection Act
            (Bundesdatenschutzgesetz). We have marked the data required to carry
            out the application process accordingly or refer to them. If
            applicants do not provide this data, we cannot process the
            application.
          </P>
          <P className="text-slate-700">
            Further data is voluntary and not required for an application. If
            applicants provide further information, the basis is their consent
            (Art. 6 para. 1 s. 1 lit. a GDPR).
          </P>
          <P className="text-slate-700">
            We ask applicants to refrain from providing information on political
            opinions, religious beliefs and similarly sensitive data in their CV
            and cover letter. They are not required for an application. If
            applicants nevertheless provide such information, we cannot prevent
            their processing as part of the processing of the resume or cover
            letter. Their processing is then also based on the consent of the
            applicants (Art. 9 para. 2 lit. a GDPR).
          </P>
          <P className="text-slate-700">
            Finally, we process the applicants&apos; data for further
            application procedures if they have given us their consent to do so.
            In this case, the legal basis is Art. 6 para. 1 s. 1 lit. a GDPR.
          </P>
          <P className="text-slate-700">
            We pass on the applicants&apos; data to the responsible employees in
            the HR department, to our data processors in the area of recruiting
            and to the employees otherwise involved in the application process.
          </P>
          <P className="text-slate-700">
            If we enter into an employment relationship with the applicant
            following the application process, we delete the data only after the
            employment relationship has ended. Otherwise, we delete the data no
            later than six months after rejecting an applicant.
          </P>
          <P className="text-slate-700">
            If applicants have given us their consent to use their data for
            further application procedures as well, we will not delete their
            data until one year after receiving the application.
          </P>

          <H3 className="mb-2 mt-4 font-semibold text-slate-800">
            3.6. Booking of appointments
          </H3>
          <P className="text-slate-700">
            Site visitors can book appointments with us on our website. For this
            purpose, we process meta data or communication data in addition to
            the data entered. We have a legitimate interest in offering
            interested parties a user-friendly option for making appointments.
            Therefore, the legal basis for data processing is Art. 6 para. 1 s.
            1 lit. f GDPR. Insofar as we use a third-party tool for the
            agreement, the information on this can be found under &quot;Third
            parties&quot;.
          </P>

          <H3 className="mb-2 mt-4 font-semibold text-slate-800">
            3.7. Customer account
          </H3>
          <P className="text-slate-700">
            Site visitors can open a customer account on our website. We process
            the data requested in this context based on a contract with the
            user. Legal basis for the processing is Art. 6 para. 1 s. 1 lit. b
            GDPR.
          </P>
          <P className="text-slate-700">
            Beyond the data entered during registration, we process
            login/out-dates, session times, user interaction data, device,
            location.
          </P>

          <H3 className="mb-2 mt-4 font-semibold text-slate-800">
            3.8. Single-sign on
          </H3>
          <P className="text-slate-700">
            Users can log in to our website using one or more single sign-on
            methods. In doing so, they use the login data already created for a
            provider. The prerequisite is that the user is already registered
            with the respective provider. When a user logs in using a single
            sign-on procedure, we receive information from the provider that the
            user is logged in to the provider and the provider receives
            information that the user is using the single sign-on procedure on
            our website. Depending on the user&apos;s settings in his account on
            the provider&apos;s site, additional information may be provided to
            us by the provider. The legal basis for this processing is Art. 6
            para. 1 sentence 1 lit. f GDPR. We have a legitimate interest in
            providing users with a simple log-in option. At the same time, the
            interests of the users are safeguarded, as use is only voluntary.
          </P>
          <P className="text-slate-700">
            Providers of the offered method(s) are:
            <ul className="mt-2 list-disc pl-5">
              <li>
                Google Ireland Limited, Gordon House, Barrow Street, Dublin 4,
                Ireland (privacy policy:{" "}
                <Link
                  href="https://policies.google.com/privacy"
                  className="text-primary hover:underline"
                >
                  https://policies.google.com/privacy
                </Link>
                )
              </li>
            </ul>
          </P>

          <H3 className="mb-2 mt-4 font-semibold text-slate-800">
            3.9. Technically necessary cookies
          </H3>
          <P className="text-slate-700">
            Our website sets cookies. Cookies are small text files that are
            stored in the web browser on the end device of a site visitor.
            Cookies help to make the offer more user-friendly, effective and
            secure. Insofar as these cookies are necessary for the operation of
            our website or its functions (hereinafter &quot;Technically
            Necessary Cookies&quot;), the legal basis for the associated data
            processing is Art. 6 para. 1 s. 1 lit. f GDPR. We have a legitimate
            interest in providing customers and other site visitors with a
            functional website.
          </P>
          <P className="text-slate-700">
            Specifically, we set technically necessary cookies for the following
            purpose or purposes:
            <ul className="mt-2 list-disc pl-5">
              <li>Cookies that adopt language settings,</li>
              <li>Cookies that store log-in data</li>
            </ul>
          </P>

          <H3 className="mb-2 mt-4 font-semibold text-slate-800">
            3.10. Data analysis
          </H3>
          <P className="text-slate-700">
            Users can insert or upload data in order to perform analyses on this
            data. User data may be processed in order to deliver the analysis.
            We use service providers in order to offer these services. These
            include data hosting services. The legal basis for processing data
            is the contractual relationship with the user.
          </P>

          <H3 className="mb-2 mt-4 font-semibold text-slate-800">
            3.11. Third-parties
          </H3>
          <H4 className="mb-2 mt-4 font-semibold text-slate-800">
            3.11.1 Google Analytics
          </H4>
          <P className="text-slate-700">
            We use Google Analytics for analysis. The provider is Google Ireland
            Limited, Gordon House, Barrow Street, Dublin 4, Dublin, Ireland. The
            provider processes usage data (e.g. websites visited, interest in
            content, access times) and meta/communication data (e.g. device
            information, IP addresses) in the USA.
          </P>
          <P className="text-slate-700">
            The legal basis for processing is Art. 6 para. 1 s. 1 lit. a GDPR.
            Processing is carried out on the basis of consent. Data subjects can
            withdraw their consent at any time, e.g. by contacting us using the
            contact details provided in our privacy policy. The revocation does
            not affect the lawfulness of the processing until the revocation.
          </P>
          <P className="text-slate-700">
            The legal basis for the transfer to a country outside the EEA is an
            adequacy decision. The security of the data transferred to the third
            country (i.e. a country outside the EEA) is guaranteed because the
            EU Commission has decided in an adequacy decision pursuant to Art.
            45 (3) GDPR that the third country offers an adequate level of
            protection.
          </P>
          <P className="text-slate-700">
            The data will be deleted when the purpose of its collection no
            longer applies and there is no obligation to retain it. Further
            information can be found in the provider&apos;s privacy policy at{" "}
            <Link
              href="https://policies.google.com/privacy"
              className="text-primary hover:underline"
            >
              https://policies.google.com/privacy
            </Link>
            .
          </P>

          <H4 className="mb-2 mt-4 font-semibold text-slate-800">
            3.11.2. Auth0 by Okta
          </H4>
          <P className="text-slate-700">
            We use Auth0 to manage authentication. The provider is Okta, Inc,
            100 First Street, San Francisco, California 94105, USA. The provider
            processes contact data (e.g. email addresses, telephone numbers),
            meta/communication data (e.g. device information, IP addresses) and
            master data (e.g. names, addresses) in the EU.
          </P>
          <P className="text-slate-700">
            The legal basis for processing is Art. 6 para. 1 s. 1 lit. f GDPR.
            We have a legitimate interest in sufficiently authenticating users
            of our applications.
          </P>
          <P className="text-slate-700">
            We delete the data when the purpose for which it was collected no
            longer applies. Further information can be found in the
            provider&apos;s privacy policy at{" "}
            <Link
              href="https://www.okta.com/privacy-policy/"
              className="text-primary hover:underline"
            >
              https://www.okta.com/privacy-policy/
            </Link>
            .
          </P>

          <H4 className="mb-2 mt-4 font-semibold text-slate-800">
            3.11.3. PostHog
          </H4>
          <P className="text-slate-700">
            We use PostHog for analytics and to understand how users interact
            with our Application. We host PostHog on our own infrastructure
            within the EU.
          </P>
          <P className="text-slate-700">
            PostHog processes usage data (e.g. pages visited, features used,
            clicks, session duration), technical data (e.g. browser type, device
            information, operating system), and meta/communication data (e.g. IP
            addresses, which may be anonymized).
          </P>
          <P className="text-slate-700">
            The legal basis for processing is Art. 6 para. 1 s. 1 lit. f GDPR.
            We have a legitimate interest in analyzing user behavior to improve
            our Application&apos;s functionality and user experience.
          </P>
          <P className="text-slate-700">
            Users can opt out of analytics tracking through their account
            settings or by adjusting their browser settings to block tracking
            cookies.
          </P>
          <P className="text-slate-700">
            The data will be deleted when the purpose of its collection no
            longer applies and there is no obligation to retain it. Further
            information about PostHog can be found at{" "}
            <Link
              href="https://posthog.com/privacy"
              className="text-primary hover:underline"
            >
              https://posthog.com/privacy
            </Link>
            .
          </P>

          <section>
            <H3 className="mb-2 mt-4 font-semibold text-slate-800">
              3.12 Payment processing with Stripe
            </H3>
            <P className="text-slate-700">
              For processing payments in our Application, we use the external
              payment service provider Stripe Payments Europe, Ltd., 1 Grand
              Canal Street Lower, Grand Canal Dock, Dublin, Ireland
              (&quot;Stripe&quot;). When a user makes a payment, the required
              payment and billing data are transmitted to Stripe in order to
              process the transaction.
            </P>
            <P className="text-slate-700">
              Stripe may process data such as name, address, email address,
              payment method information (e.g. credit card details), transaction
              data, and fraud prevention data. Scavenger AI does not store full
              credit card details.
            </P>
            <P className="text-slate-700">
              The legal basis for the data processing is Art. 6 para. 1 s. 1
              lit. b GDPR (performance of a contract) and Art. 6 para. 1 s. 1
              lit. f GDPR (our legitimate interest in secure and efficient
              payment processing).
            </P>
            <P className="text-slate-700">
              Data may be transferred outside the European Economic Area (EEA),
              in particular to the USA. Stripe ensures compliance with GDPR
              requirements for international data transfers through the use of
              Standard Contractual Clauses (SCCs) approved by the European
              Commission.
            </P>
            <P className="text-slate-700">
              Further information on data processing by Stripe can be found in
              Stripe’s privacy policy:{" "}
              <Link
                href="https://stripe.com/privacy"
                className="text-primary hover:underline"
              >
                https://stripe.com/privacy
              </Link>
              .
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-primary">
              4. Data processing on social media platforms
            </H3>
            <P className="text-slate-700">
              We are represented in social media networks in order to present
              our organization and our services there. The operators of these
              networks regularly process their users&apos; data for advertising
              purposes. Among other things, they create user profiles from their
              online behavior, which are used, for example, to show advertising
              on the pages of the networks and elsewhere on the Internet that
              corresponds to the interests of the users. To this end, the
              operators of the networks store information on user behavior in
              cookies on the users&apos; computers. Furthermore, it cannot be
              ruled out that the operators merge this information with other
              data. Users can obtain further information and instructions on how
              to object to processing by the site operators in the data
              protection declarations of the respective operators listed below.
              It is also possible that the operators or their servers are
              located in non-EU countries, so that they process data there. This
              may result in risks for users, e.g. because it is more difficult
              to enforce their rights or because government agencies access the
              data.
            </P>
            <P className="text-slate-700">
              If users of the networks contact us via our profiles, we process
              the data provided to us in order to respond to the inquiries. This
              is our legitimate interest, so that the legal basis is Art. 6
              para. 1 s. 1 lit. f GDPR.
            </P>

            <H3 className="mb-2 mt-4 font-semibold text-slate-800">
              4.1. LinkedIn
            </H3>
            <P className="text-slate-700">
              We maintain a profile on LinkedIn. The operator is LinkedIn
              Ireland Unlimited Company, Wilton Place, Dublin 2, Ireland. The
              privacy policy is available here:{" "}
              <Link
                href="https://www.linkedin.com/legal/privacy-policy?_l=de_DE"
                className="text-primary hover:underline"
              >
                https://www.linkedin.com/legal/privacy-policy?_l=de_DE
              </Link>
              . One way to object to data processing is via the settings for
              advertisements:{" "}
              <Link
                href="https://www.linkedin.com/psettings/guest-controls/retargeting-opt-out"
                className="text-primary hover:underline"
              >
                https://www.linkedin.com/psettings/guest-controls/retargeting-opt-out
              </Link>
              .
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-primary">
              5. Changes to this privacy policy
            </H3>
            <P className="text-slate-700">
              We reserve the right to change this privacy policy with effect for
              the future. A current version is always available here.
            </P>
          </section>

          <section>
            <H3 className="mb-2 font-bold text-primary">
              6. Questions and comments
            </H3>
            <P className="text-slate-700">
              If you have any questions or comments regarding this privacy
              policy, please feel free to contact us using the contact
              information provided above.
            </P>
          </section>
        </div>
      </div>
    </div>
  );
}
