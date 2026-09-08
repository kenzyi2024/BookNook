import LegalLayout from './LegalLayout';

// TODO: set the address you want people to reach you at.
const CONTACT_EMAIL = 'hello@booknook.app';
const LAST_UPDATED = 'September 8, 2026';

const H = ({ children }) => (
  <h2 className="font-display font-bold text-xl text-ink mt-8 mb-2">{children}</h2>
);
const P = ({ children }) => <p className="text-stone-600 leading-relaxed mb-3">{children}</p>;

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms &amp; Conditions" subtitle={`Last updated ${LAST_UPDATED}`}>
      <P>
        Welcome to BookNook. By creating an account or using the app, you agree to these terms.
        Please read them &mdash; they&rsquo;re meant to be plain and fair.
      </P>

      <H>The service</H>
      <P>
        BookNook is a personal reading tracker that lets you catalog books, log reading, save notes
        and quotes, and use optional AI-assisted features. We may add, change, or remove features
        over time.
      </P>

      <H>Your account</H>
      <P>
        You are responsible for keeping your login credentials secure and for activity that happens
        under your account. Provide accurate information when you sign up, and let us know if you
        suspect unauthorized use.
      </P>

      <H>Acceptable use</H>
      <P>
        Please use BookNook lawfully. Do not attempt to break, overload, or reverse-engineer the
        service, access other users&rsquo; data, upload malicious content, or use the app to
        infringe anyone&rsquo;s rights. We may suspend accounts that abuse the service.
      </P>

      <H>Your content</H>
      <P>
        The notes, quotes, ratings, and other content you add remain yours. You grant us only the
        permission needed to store and display that content back to you as part of running the app.
        You are responsible for the content you add, including respecting the copyright of any
        material you quote.
      </P>

      <H>AI features</H>
      <P>
        AI-generated analysis, recaps, and suggestions are provided for convenience and may be
        inaccurate or incomplete. They are not professional advice. Please use your own judgment and
        verify anything important.
      </P>

      <H>Availability &amp; warranty</H>
      <P>
        BookNook is provided &ldquo;as is&rdquo; without warranties of any kind. We work to keep the
        service running but cannot guarantee it will always be available, uninterrupted, or
        error-free, and we are not responsible for any loss of data.
      </P>

      <H>Limitation of liability</H>
      <P>
        To the fullest extent permitted by law, BookNook and its operator will not be liable for any
        indirect, incidental, or consequential damages arising from your use of the service.
      </P>

      <H>Termination</H>
      <P>
        You may stop using BookNook and request account deletion at any time. We may suspend or
        terminate access if these terms are violated.
      </P>

      <H>Changes</H>
      <P>
        We may update these terms occasionally. Continued use after a change means you accept the
        updated terms. We will revise the &ldquo;last updated&rdquo; date above when we do.
      </P>

      <H>Contact</H>
      <P>
        Questions about these terms? Reach us at{' '}
        <a className="text-brand-600 hover:text-brand-700 font-medium" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </P>
    </LegalLayout>
  );
}
