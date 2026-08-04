import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import logoImg from '../../assets/logo.png';

/**
 * Animated brand hero (logo + tagline). No auth logic — used as the left/top
 * panel of the AuthPage. Kept Clerk-free.
 */
export default function LandingPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline()
        .fromTo(
          '.typewriter-container',
          { width: '0%' },
          { width: '100%', duration: 1.2, ease: 'steps(15)', delay: 0.3 }
        )
        .fromTo(
          '.intro-logo',
          { opacity: 0, scale: 0.85, filter: 'blur(10px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'power2.out' }
        )
        .fromTo(
          '.hero-tagline',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
          '-=0.7'
        );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center text-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-brand-100)_0%,transparent_60%)] opacity-60" />
      <style>{`
        .typewriter-cursor::after {
          content: '|';
          animation: blink 1s step-end infinite;
          margin-left: 4px;
        }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>

      <div className="z-10 flex flex-col items-center">
        <div className="typewriter-container overflow-hidden whitespace-nowrap flex justify-center mb-6">
          <span className="text-2xl md:text-4xl font-display font-semibold text-stone-700 typewriter-cursor tracking-tight">
            welcome to your
          </span>
        </div>
        <img src={logoImg} alt="BookNook logo" className="intro-logo h-32 md:h-44 object-contain opacity-0 drop-shadow-md mb-6" />
        <p className="hero-tagline opacity-0 text-stone-500 text-lg max-w-sm">
          Track your reading, visualize your habits, and dig deeper into the stories you love.
        </p>
      </div>
    </div>
  );
}
