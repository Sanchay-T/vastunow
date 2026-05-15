import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — My Vaastu Pandit',
  description:
    'How My Vaastu Pandit handles your floor plan uploads, anonymous analysis data, and third-party AI processing.',
};

const LAST_UPDATED = 'May 15, 2026';

export default function PrivacyPage() {
  return (
    <div className="bg-[var(--background)] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 sacred-pattern pointer-events-none" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-[0.05] hidden md:block">
          <Image
            src="/images/compass-gold.png"
            alt=""
            width={500}
            height={500}
            className="w-[500px] h-[500px]"
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--foreground)]/60 hover:text-[var(--primary)] transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--gold)]" />
            <p className="text-[10px] sm:text-[11px] text-[var(--gold)] tracking-[0.3em] uppercase font-semibold">
              Legal
            </p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--gold)]" />
          </div>

          <h1
            className="text-3xl sm:text-4xl font-bold text-[var(--primary)] mb-3 leading-[1.15]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Privacy Policy
          </h1>

          <div className="w-16 h-0.5 bg-gradient-to-r from-[var(--gold)] via-[var(--gold)] to-transparent mb-4" />

          <p className="text-xs text-[var(--foreground)]/50">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Summary Callout */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
        <div
          className="rounded-2xl border bg-white/70 backdrop-blur-sm p-5 sm:p-6 flex gap-4"
          style={{
            borderColor: 'color-mix(in srgb, var(--secondary) 35%, transparent)',
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--secondary) 18%, transparent)',
            }}
          >
            <ShieldCheck className="w-4.5 h-4.5" strokeWidth={2.5} style={{ color: 'var(--secondary)' }} />
          </div>
          <div>
            <h2
              className="text-base sm:text-lg font-bold text-[var(--secondary)] mb-1.5"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              In short
            </h2>
            <p className="text-sm text-[var(--foreground)]/80 leading-relaxed">
              We do not require sign-up. We process your uploaded floor plan to generate your
              Vaastu analysis and we use third-party AI providers (AWS Bedrock) to do so. We do
              not sell your data. The analysis itself is AI-generated and provided for
              informational purposes only — see our{' '}
              <Link href="/terms" className="text-[var(--primary)] underline hover:text-[var(--primary-light)]">
                Terms &amp; Conditions
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <div className="space-y-8">
          <Section title="1. Who We Are">
            <p>
              My Vaastu Pandit (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates a free,
              anonymous tool that analyses user-uploaded floor plans using AI and the principles
              of Vaastu Shastra.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We only collect what is needed to deliver and improve the Service:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <strong>Floor plan uploads:</strong> the image or PDF you upload.
              </li>
              <li>
                <strong>Inputs you provide:</strong> facing direction, room labels, and other
                review choices you make in the flow.
              </li>
              <li>
                <strong>Analysis output:</strong> the AI-generated parsed floor plan, scores,
                findings, and remedies.
              </li>
              <li>
                <strong>Basic technical data:</strong> standard server logs (IP address,
                user-agent, request timestamps) and anonymous analytics (e.g. Microsoft Clarity)
                used to understand product usage.
              </li>
            </ul>
            <p className="mt-2">
              We do <strong>not</strong> ask you to create an account, and we do not collect
              your name, email, phone number, or address unless you voluntarily share it with us.
            </p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To generate your Vaastu analysis report.</li>
              <li>To operate, maintain, and improve the Service.</li>
              <li>To diagnose technical issues and prevent abuse.</li>
              <li>To understand aggregate usage patterns through privacy-respecting analytics.</li>
            </ul>
          </Section>

          <Section title="4. Third-Party AI Processing">
            <p>
              To produce your analysis, your uploaded floor plan image is transmitted to and
              processed by third-party AI providers, including AWS Bedrock (which serves
              Anthropic Claude models). These providers process your image under their own
              privacy terms.
            </p>
            <p>
              AWS Bedrock states that customer data is not used to train foundation models by
              default. We do not authorise any third party to use your data for model training.
            </p>
          </Section>

          <Section title="5. Data Storage &amp; Retention">
            <p>
              Uploaded images and generated reports may be stored temporarily on our
              infrastructure (including AWS S3 and a Postgres database) to deliver your report
              and allow you to revisit it via its report link.
            </p>
            <p>
              Because the Service is anonymous, we cannot tie any stored record back to an
              individual user. We retain analysis records for as long as is reasonably needed
              for product operation and quality improvement.
            </p>
          </Section>

          <Section title="6. Cookies &amp; Local Storage">
            <p>
              We use browser <code>sessionStorage</code> to hold your in-progress analysis
              between steps. We use Microsoft Clarity for anonymous usage analytics, which may
              set cookies on your device. We do not use advertising or cross-site tracking
              cookies.
            </p>
          </Section>

          <Section title="7. Data Sharing">
            <p>We do not sell your data. We share information only:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>With service providers (AWS, AI model providers, analytics) strictly to operate the Service.</li>
              <li>If required by law, court order, or to protect rights and safety.</li>
            </ul>
          </Section>

          <Section title="8. Your Choices">
            <p>
              Because the Service is anonymous, we do not have a mechanism to identify which
              records belong to a specific person, so traditional data-subject access or
              deletion requests cannot be served on a per-user basis. You can choose not to use
              the Service if you are not comfortable with this.
            </p>
            <p>
              You may also disable analytics by using browser features (e.g. tracking-protection
              modes) that block scripts such as Microsoft Clarity.
            </p>
          </Section>

          <Section title="9. Children">
            <p>
              The Service is not directed to children under 13. We do not knowingly collect
              information from children.
            </p>
          </Section>

          <Section title="10. Security">
            <p>
              We take reasonable technical and organisational measures to protect data in
              transit and at rest. No method of transmission or storage is 100% secure; we
              cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="11. International Users">
            <p>
              The Service may be operated from, and data processed in, jurisdictions outside
              your own (including India and AWS regions). By using the Service you consent to
              such cross-border processing.
            </p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Updates will be reflected on
              this page along with a new &quot;Last updated&quot; date.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              For privacy questions, please reach out via the contact channels listed on the
              home page.
            </p>
          </Section>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="text-lg sm:text-xl font-bold text-[var(--secondary)] mb-2"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {title}
      </h2>
      <div className="text-sm sm:text-[15px] leading-relaxed space-y-3 text-[var(--foreground)]/80">
        {children}
      </div>
    </div>
  );
}
