import { useEffect, useRef } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Renders Google's official "Continue with Google" button using Google Identity
 * Services. Calls onCredential(idToken) when the user signs in. Renders nothing
 * if VITE_GOOGLE_CLIENT_ID isn't configured.
 */
export default function GoogleSignIn({ onCredential }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;

    const render = () => {
      if (!window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => onCredential(resp.credential),
      });
      ref.current.innerHTML = '';
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return;
    }
    let script = document.getElementById('gsi-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', render);
    return () => script.removeEventListener('load', render);
  }, [onCredential]);

  if (!CLIENT_ID) return null;
  return <div ref={ref} className="flex justify-center min-h-[44px]" />;
}
