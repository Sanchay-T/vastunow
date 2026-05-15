import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions — My Vaastu Pandit',
  description:
    'Terms and conditions for using My Vaastu Pandit. Our analysis is AI-generated and is provided for informational purposes only.',
};

const LAST_UPDATED = 'May 15, 2026';

export default function TermsPage() {
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
            Terms &amp; Conditions
          </h1>

          <div className="w-16 h-0.5 bg-gradient-to-r from-[var(--gold)] via-[var(--gold)] to-transparent mb-4" />

          <p className="text-xs text-[var(--foreground)]/50">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* AI Disclaimer Callout */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
        <div
          className="rounded-2xl border bg-white/70 backdrop-blur-sm p-5 sm:p-6 flex gap-4"
          style={{
            borderColor: 'color-mix(in srgb, var(--gold) 35%, transparent)',
          }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--gold) 18%, transparent)',
            }}
          >
            <AlertTriangle className="w-4.5 h-4.5" strokeWidth={2.5} style={{ color: 'var(--gold)' }} />
          </div>
          <div>
            <h2
              className="text-base sm:text-lg font-bold text-[var(--secondary)] mb-1.5"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              AI-Generated Results — Not Legally Implied
            </h2>
            <p className="text-sm text-[var(--foreground)]/80 leading-relaxed">
              The results produced by My Vaastu Pandit are AI-based and we are not legally
              implied. The analysis, scores, findings, and remedies are generated automatically
              by artificial intelligence models for informational and educational purposes only.
              They do not constitute professional, architectural, religious, financial, medical,
              or legal advice, and no legal obligation, warranty, or liability is implied on our
              part by their use.
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <div className="prose prose-sm sm:prose-base max-w-none text-[var(--foreground)]/80 leading-relaxed space-y-8">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using My Vaastu Pandit (the &quot;Service&quot;), you agree to be
              bound by these Terms &amp; Conditions. If you do not agree to any part of these
              terms, please do not use the Service.
            </p>
          </Section>

          <Section title="2. Nature of the Service">
            <p>
              My Vaastu Pandit provides an AI-powered analysis of user-uploaded floor plan
              images based on commonly accepted principles of Vaastu Shastra. The Service is
              offered free of charge and without any sign-up or account.
            </p>
          </Section>

          <Section title="3. AI-Based Results — No Liability">
            <p>
              <strong>The results are AI-based and legally we are not implied.</strong> All
              scores, findings, room placements, directional assessments, remedies, and any
              other output generated by the Service are produced by automated AI systems and
              should be treated as informational only.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>The Service does not guarantee accuracy, completeness, or fitness for any particular purpose.</li>
              <li>Different Vaastu traditions and practitioners may offer different guidance for the same floor plan.</li>
              <li>We are not liable for any decision — structural, financial, religious, personal, or otherwise — made on the basis of the Service&apos;s output.</li>
              <li>For binding decisions involving construction, renovation, purchase, or religious observance, please consult a qualified human professional.</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree to use the Service only for lawful purposes. You will not:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Upload content you do not have the right to upload.</li>
              <li>Attempt to disrupt, reverse-engineer, or overload the Service.</li>
              <li>Use the Service to generate misleading or harmful content for others.</li>
            </ul>
          </Section>

          <Section title="5. Intellectual Property">
            <p>
              The Service, including its branding, design, illustrations, and underlying code,
              belongs to My Vaastu Pandit. The analysis output generated for your uploaded floor
              plan is provided to you for personal, non-commercial use.
            </p>
          </Section>

          <Section title="6. User-Submitted Content">
            <p>
              You retain ownership of any floor plan or image you upload. By uploading content,
              you grant us a limited licence to process that content through our AI pipeline
              solely to generate your analysis. See our{' '}
              <Link href="/privacy" className="text-[var(--primary)] underline hover:text-[var(--primary-light)]">
                Privacy Policy
              </Link>{' '}
              for details on storage and third-party processing.
            </p>
          </Section>

          <Section title="7. Third-Party Services">
            <p>
              The Service uses third-party AI providers (including AWS Bedrock) to perform
              analysis. Your uploaded image is transmitted to and processed by these providers
              under their own terms. We do not control and are not responsible for the conduct
              of any third-party service.
            </p>
          </Section>

          <Section title="8. Disclaimer of Warranties">
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot;, without
              warranties of any kind, whether express or implied, including warranties of
              merchantability, fitness for a particular purpose, accuracy, or non-infringement.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, My Vaastu Pandit, its operators, and its
              contributors shall not be liable for any direct, indirect, incidental, special,
              consequential, or exemplary damages arising out of or in connection with your use
              of, or inability to use, the Service or its AI-generated output.
            </p>
          </Section>

          <Section title="10. Changes to These Terms">
            <p>
              We may revise these Terms at any time by updating this page. Continued use of the
              Service after a revision constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of
              India, without regard to its conflict-of-laws provisions.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              For questions about these Terms, please reach out via the contact channels listed
              on the home page.
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
      <div className="text-sm sm:text-[15px] leading-relaxed space-y-3">{children}</div>
    </div>
  );
}
