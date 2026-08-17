import { useMemo, useRef, useState } from 'react';
import { X, Download, Star, Flame, BookOpen, Layers, Sparkles } from 'lucide-react';
import { buildWrapped, readingYears } from '../../lib/wrapped';
import { THEMES, DEFAULT_THEME } from '../../lib/themes';
import { useTheme } from '../../context/ThemeContext';
import logoImg from '../../assets/logo.png';

const logoImage = new Image();
logoImage.src = logoImg;

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * "Your Year in Books" — a warm, animated recap of a reading year, with a
 * downloadable poster. Re-skins to the active theme.
 */
export default function WrappedView({ books, onClose }) {
  const { theme } = useTheme();
  const years = useMemo(() => readingYears(books), [books]);
  const [year, setYear] = useState(years[0]);
  const w = useMemo(() => buildWrapped(books, year), [books, year]);
  const canvasRef = useRef(null);

  const V = (THEMES[theme] || THEMES[DEFAULT_THEME]).vars;
  const b = (n) => V[`--color-brand-${n}`];

  const stats = [];
  if (w.hasData) {
    stats.push({ icon: <BookOpen size={20} />, big: w.count, label: w.count === 1 ? 'book finished' : 'books finished' });
    stats.push({ icon: <Layers size={20} />, big: w.pages.toLocaleString(), label: `pages${w.hours ? ` · ${w.hours}h logged` : ''}` });
    if (w.topGenre) stats.push({ icon: <Sparkles size={20} />, big: w.topGenre.label, label: 'most-read genre', small: true });
    if (w.topRated) stats.push({ icon: <Star size={20} />, big: w.topRated.title, label: `your favorite · ${w.topRated.rating}★`, small: true });
    if (w.longest) stats.push({ icon: <Layers size={20} />, big: w.longest.title, label: `longest · ${(w.longest.totalPages || 0).toLocaleString()} pages`, small: true });
    if (w.topMood) stats.push({ icon: <Sparkles size={20} />, big: w.topMood.label, label: 'the mood you reached for', small: true });
    if (w.busiestMonth) stats.push({ icon: <Flame size={20} />, big: w.busiestMonth.label, label: `your busiest month · ${w.busiestMonth.count} finished`, small: true });
    if (w.avgRating) stats.push({ icon: <Star size={20} />, big: `${w.avgRating}★`, label: 'average rating' });
    if (w.streak) stats.push({ icon: <Flame size={20} />, big: w.streak, label: 'day reading streak' });
  }

  const download = () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const W = 1080, H = 1350;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const CREAM = '#FBF7EF';
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, b(500)); grad.addColorStop(0.55, b(700)); grad.addColorStop(1, b(800));
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H * 0.24, 40, W / 2, H * 0.24, W * 0.85);
    glow.addColorStop(0, hexA(b(400), 0.5)); glow.addColorStop(1, hexA(b(400), 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = hexA(CREAM, 0.28); ctx.lineWidth = 2; ctx.strokeRect(54, 54, W - 108, H - 108);
    ctx.textAlign = 'center';
    const serif = 'Georgia, serif';

    ctx.fillStyle = hexA(CREAM, 0.75); ctx.font = `600 32px ${serif}`;
    ctx.fillText(`MY ${w.year} IN BOOKS`.split('').join(' '), W / 2, 150);

    ctx.fillStyle = CREAM; ctx.font = `700 220px ${serif}`;
    ctx.fillText(String(w.count), W / 2, 400);
    ctx.font = `italic 40px ${serif}`; ctx.fillStyle = hexA(CREAM, 0.9);
    ctx.fillText(w.count === 1 ? 'book finished' : 'books finished', W / 2, 456);

    const rows = [];
    rows.push(['Pages read', w.pages.toLocaleString()]);
    if (w.hours) rows.push(['Hours logged', `${w.hours}h`]);
    if (w.topGenre) rows.push(['Most-read genre', w.topGenre.label]);
    if (w.topRated) rows.push(['Favorite read', trunc(w.topRated.title, 22)]);
    if (w.longest) rows.push(['Longest book', trunc(w.longest.title, 22)]);
    if (w.topMood) rows.push(['Signature mood', w.topMood.label]);
    if (w.busiestMonth) rows.push(['Busiest month', w.busiestMonth.label]);
    if (w.avgRating) rows.push(['Average rating', `${w.avgRating} / 5`]);
    if (w.streak) rows.push(['Day streak', String(w.streak)]);

    let y = 560;
    rows.slice(0, 8).forEach(([k, v]) => {
      ctx.textAlign = 'left'; ctx.fillStyle = hexA(CREAM, 0.72); ctx.font = `500 34px ${serif}`;
      ctx.fillText(k, 130, y);
      ctx.textAlign = 'right'; ctx.fillStyle = CREAM; ctx.font = `700 38px ${serif}`;
      ctx.fillText(v, W - 130, y);
      ctx.strokeStyle = hexA(CREAM, 0.16); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(130, y + 22); ctx.lineTo(W - 130, y + 22); ctx.stroke();
      y += 78;
    });

    // logo wordmark
    ctx.textAlign = 'center'; ctx.fillStyle = b(100); ctx.font = `700 60px ${serif}`;
    ctx.fillText('BookNook', W / 2, H - 90);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `booknook-${w.year}-wrapped.png`; a.click();
  };

  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto" style={{ background: `linear-gradient(160deg, ${b(500)}, ${b(700)} 55%, ${b(800)})` }}>
      <canvas ref={canvasRef} className="hidden" />
      <button onClick={onClose} aria-label="Close" className="fixed top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
        <X size={20} />
      </button>

      <div className="max-w-md mx-auto px-6 py-16 text-center text-white">
        <p className="wrapped-stat uppercase tracking-[0.2em] text-sm text-white/70" style={{ animationDelay: '0ms' }}>My reading year</p>
        <h2 className="wrapped-stat font-display font-bold text-5xl md:text-6xl mt-2 drop-shadow" style={{ animationDelay: '80ms' }}>
          {w.year} in Books
        </h2>

        {years.length > 1 && (
          <div className="wrapped-stat flex flex-wrap justify-center gap-2 mt-5" style={{ animationDelay: '160ms' }}>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${y === year ? 'bg-white text-brand-700' : 'bg-white/15 text-white hover:bg-white/25'}`}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {!w.hasData ? (
          <p className="wrapped-stat mt-10 text-white/80" style={{ animationDelay: '220ms' }}>
            No finished books in {w.year} yet — your recap will fill in as you read.
          </p>
        ) : (
          <div className="mt-10 space-y-5">
            {stats.map((s, i) => (
              <div key={i} className="wrapped-stat" style={{ animationDelay: `${240 + i * 120}ms` }}>
                <div className="flex items-center justify-center gap-2 text-white/70 mb-1">
                  {s.icon}
                </div>
                <div className={`font-display font-bold drop-shadow ${s.small ? 'text-2xl md:text-3xl' : 'text-5xl md:text-6xl'}`}>
                  {s.big}
                </div>
                <div className="text-white/75 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="wrapped-stat mt-12 flex flex-col items-center gap-3" style={{ animationDelay: `${300 + stats.length * 120}ms` }}>
          {w.hasData && (
            <button onClick={download} className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <Download size={18} /> Download image
            </button>
          )}
          <img src={logoImg} alt="BookNook" className="h-12 w-auto opacity-90 mt-2" style={{ filter: 'brightness(0) invert(1)' }} />
        </div>
      </div>
    </div>
  );
}

function trunc(s = '', n) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
