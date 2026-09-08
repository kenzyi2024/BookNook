import LegalLayout from './LegalLayout';

// TODO: set the address you want people to reach you at.
const CONTACT_EMAIL = 'privacy@booknook.app';
const LAST_UPDATED = 'September 8, 2026';

const H = ({ children }) => (
  <h2 className="font-display font-bold text-xl text-ink mt-8 mb-2">{children}</h2>
);
const P = ({ children }) => <p className="text-stone-600 leading-relaxed mb-3">{children}</p>;

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" subtitle={`Last updated ${LAST_UPDATED}`}>
      <P>
        BookNook is a personal reading tracker. This policy explains what we collect, why, and the
        choices you have. We keep it short because we collect as little as possible.
      </P>

      <H>Information we collect</H>
      <P>
        <strong>Account details.</strong> When you sign up we store your email address and a display
        name. If you register with a password, we store only a securely hashed version of it &mdash;
        never the password itself. If you sign in with Google, we receive your email, name, and
        profile picture from Google.
      </P>
      <P>
        <strong>Your reading data.</strong> The books, reading sessions, ratings, notes, quotes,
        journal entries, and other content you add are stored so we can show them back to you.
      </P>
      <P>
        <strong>Technical data.</strong> Our host records standard server logs (such as IP address
        and request time) for security and reliability, and we use privacy-friendly, cookieless
        analytics to understand aggregate usage. This analytics data cannot identify you.
      </P>

      <H>How we use your information</H>
      <P>
        We use your data to run the app: to authenticate you, save and display your library, and
        power features you choose to use. We do not sell your personal information, and we do not use
        it for advertising.
      </P>

      <H>AI features</H>
      <P>
        Some optional features (such as book analysis, recaps, and the reading companion) send the
        relevant text to a third-party AI provider to generate a response. Only the content needed
        for that feature is sent, and it is used to produce your result &mdash; not to identify you.
        If you prefer not to share content this way, simply do not use those features.
      </P>

      <H>Storage and security</H>
      <P>
        Your data is stored in a managed MongoDB database. Traffic is encrypted in transit over
        HTTPS, passwords are hashed with bcrypt, and access to the app is protected by signed
        session tokens. No system is perfectly secure, but we take reasonable measures to protect
        your information.
      </P>

      <H>Cookies and local storage</H>
      <P>
        BookNook does not use advertising or third-party tracking cookies. We use your browser&rsquo;s
        local storage to keep you signed in and to remember preferences like your theme. This data
        stays in your browser. Our analytics is cookieless.
      </P>

      <H>Your choices</H>
      <P>
        You can edit your profile and reading data at any time inside the app. You can request that
        we delete your account and associated data by contacting us at the address below. Signing out
        clears your session from your browser.
      </P>

      <H>Children</H>
      <P>
        BookNook is not directed to children under 13, and we do not knowingly collect information
        from them.
      </P>

      <H>Changes</H>
      <P>
        We may update this policy from time to time. When we do, we will revise the &ldquo;last
        updated&rdquo; date above.
      </P>

      <H>Contact</H>
      <P>
        Questions about your privacy? Reach us at{' '}
        <a className="text-brand-600 hover:text-brand-700 font-medium" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </P>
    </LegalLayout>
  );
}
