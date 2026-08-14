import { useRef, useEffect, useState, useCallback } from 'react';
import { Download, X, Share2 } from 'lucide-react';
import { fmtDate } from '../../lib/format';
import { THEMES, DEFAULT_THEME } from '../../lib/themes';
import { useTheme } from '../../context/ThemeContext';
import logoImg from '../../assets/logo.png';

// Preloaded once; drawn (and tinted) onto the share canvas as the wordmark.
const logoImage = new Image();
logoImage.src = logoImg;

const W = 1080;
const H = 1350;
const CREAM = '#FBF7EF';
const GOLD = '#EEC66A';

// --- small helpers -----------------------------------------------------------
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function wrap(ctx, text, maxWidth) {
  const out = [];
  text.split(/\n/).forEach((para) => {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    out.push(line);
  });
  return out;
}

// Pick the largest font size at which `text` fits the given box; truncate if not.
function fitParagraph(ctx, text, { maxWidth, maxHeight, family, style, sizes, lh }) {
  let chosen = sizes[sizes.length - 1];
  let lines = [];
  for (const size of sizes) {
    ctx.font = `${style} ${size}px ${family}`;
    lines = wrap(ctx, text, maxWidth);
    chosen = size;
    if (lines.length * size * lh <= maxHeight) return { size, lines };
  }
  const maxLines = Math.max(1, Math.floor(maxHeight / (chosen * lh)));
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s.,;:]+$/, '')}…`;
  }
  return { size: chosen, lines };
}

// Recolor the (transparent-background) logo to a single tint.
function tintedLogo(color) {
  if (!logoImage.complete || !logoImage.naturalWidth) return null;
  const o = document.createElement('canvas');
  o.width = logoImage.naturalWidth;
  o.height = logoImage.naturalHeight;
  const c = o.getContext('2d');
  c.drawImage(logoImage, 0, 0);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = color;
  c.fillRect(0, 0, o.width, o.height);
  return o;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * A downloadable share card for a finished book, a saved quote, or a reflection.
 * Drawn on a canvas so it exports as a clean PNG. The whole card is themed: the
 * gradient, accents, and logo tint all come from the chosen color theme.
 */
export default function ShareCard({ kind = 'book', book, quote, answer, onClose }) {
  const canvasRef = useRef(null);
  const { theme: activeTheme } = useTheme();
  const [themeId, setThemeId] = useState(THEMES[activeTheme] ? activeTheme : DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  const draw = useCallback(
    (coverImg) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const V = (THEMES[themeId] || THEMES[DEFAULT_THEME]).vars;
      const b = (n) => V[`--color-brand-${n}`];
      const logoTint = b(100);

      // --- Background: theme gradient + warm glow + soft vignette ---
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, b(500));
      grad.addColorStop(0.55, b(700));
      grad.addColorStop(1, b(800));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(W * 0.5, H * 0.26, 40, W * 0.5, H * 0.26, W * 0.85);
      glow.addColorStop(0, hexA(b(400), 0.55));
      glow.addColorStop(1, hexA(b(400), 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.72);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.28)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // Inset hairline frame
      ctx.strokeStyle = hexA(CREAM, 0.28);
      ctx.lineWidth = 2;
      roundRectPath(ctx, 54, 54, W - 108, H - 108, 40);
      ctx.stroke();

      ctx.textAlign = 'center';
      const serif = 'Georgia, "Times New Roman", serif';

      // Header label
      const labels = { book: 'FINISHED READING', quote: 'A LINE WORTH KEEPING', reflection: 'A REFLECTION' };
      ctx.fillStyle = hexA(CREAM, 0.72);
      ctx.font = '600 30px Georgia, serif';
      ctx.fillText(spaced(labels[kind] || 'BOOKNOOK'), W / 2, 148);
      // small rule under the label
      ctx.strokeStyle = hexA(GOLD, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 60, 172);
      ctx.lineTo(W / 2 + 60, 172);
      ctx.stroke();

      const drawCover = (cx, cy, cw, ch, radius = 12) => {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 14;
        roundRectPath(ctx, cx, cy, cw, ch, radius);
        if (coverImg) {
          ctx.clip();
          ctx.drawImage(coverImg, cx, cy, cw, ch);
        } else {
          ctx.fillStyle = b(600);
          ctx.fill();
        }
        ctx.restore();
        // spine sliver + border
        if (!coverImg) {
          ctx.fillStyle = hexA('#ffffff', 0.14);
          ctx.fillRect(cx, cy, 10, ch);
        }
        ctx.strokeStyle = hexA(CREAM, 0.3);
        ctx.lineWidth = 2;
        roundRectPath(ctx, cx, cy, cw, ch, radius);
        ctx.stroke();
      };

      const drawStars = (rating, cy, starFont = 56) => {
        ctx.font = `${starFont}px Georgia, serif`;
        const str = '★★★★★';
        const sw = ctx.measureText(str).width;
        const x0 = W / 2 - sw / 2;
        ctx.textAlign = 'left';
        ctx.fillStyle = hexA(CREAM, 0.25);
        ctx.fillText(str, x0, cy);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, cy - starFont, (rating / 5) * sw, starFont * 1.4);
        ctx.clip();
        ctx.fillStyle = GOLD;
        ctx.fillText(str, x0, cy);
        ctx.restore();
        ctx.textAlign = 'center';
      };

      const drawLogo = () => {
        const tl = tintedLogo(logoTint);
        if (tl) {
          const lh = 128;
          const lw = Math.min((tl.width / tl.height) * lh, W - 240);
          ctx.globalAlpha = 0.96;
          ctx.drawImage(tl, W / 2 - lw / 2, H - 198, lw, lh);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = logoTint;
          ctx.font = '700 72px Georgia, serif';
          ctx.fillText('BookNook', W / 2, H - 86);
        }
      };

      if (kind === 'book') {
        const cw = 260;
        const ch = 390;
        drawCover(W / 2 - cw / 2, 185, cw, ch, 14);

        let y = 645;
        ctx.fillStyle = CREAM;
        const title = fitParagraph(ctx, book.title, {
          maxWidth: W - 220, maxHeight: 190, family: serif, style: '700', sizes: [72, 64, 56, 50], lh: 1.14,
        });
        title.lines.forEach((ln) => { ctx.fillText(ln, W / 2, y); y += title.size * 1.14; });

        ctx.fillStyle = hexA(CREAM, 0.85);
        ctx.font = `italic 38px ${serif}`;
        ctx.fillText(book.author, W / 2, y + 8);
        y += 78;

        if (book.rating) { drawStars(book.rating, y + 18); y += 84; }

        // stats row
        const stat = (label, val, x) => {
          ctx.fillStyle = CREAM;
          ctx.font = `700 52px ${serif}`;
          ctx.fillText(String(val), x, y + 28);
          ctx.fillStyle = hexA(CREAM, 0.68);
          ctx.font = `600 25px ${serif}`;
          ctx.fillText(spaced(label), x, y + 72);
        };
        stat('PAGES', book.totalPages, W / 2 - 190);
        stat('GENRE', (book.genre || '—').slice(0, 13), W / 2 + 190);
        ctx.fillStyle = hexA(CREAM, 0.22);
        ctx.fillRect(W / 2 - 1, y - 22, 2, 92);

        if (book.finishedAt) {
          ctx.fillStyle = hexA(CREAM, 0.75);
          ctx.font = `28px ${serif}`;
          ctx.fillText(`Finished ${fmtDate(book.finishedAt)}`, W / 2, H - 260);
        }
      } else {
        // quote / reflection — text-forward layout
        const text = kind === 'quote' ? quote?.text || '' : answer?.text || '';

        // big opening quotation mark
        ctx.fillStyle = hexA(GOLD, 0.85);
        ctx.font = `700 150px ${serif}`;
        ctx.fillText('“', W / 2, 320);

        // (reflection) show the prompt above, small + muted
        let topY = 400;
        if (kind === 'reflection' && answer?.prompt) {
          ctx.fillStyle = hexA(CREAM, 0.7);
          const p = fitParagraph(ctx, answer.prompt, {
            maxWidth: W - 260, maxHeight: 150, family: serif, style: 'italic', sizes: [30, 27, 24], lh: 1.3,
          });
          let py = topY;
          p.lines.forEach((ln) => { ctx.fillText(ln, W / 2, py); py += p.size * 1.3; });
          topY = py + 26;
        }

        const bodyTop = kind === 'reflection' ? topY : 360;
        const bodyMaxH = (H - 430) - bodyTop;
        ctx.fillStyle = CREAM;
        const body = fitParagraph(ctx, `${text}`, {
          maxWidth: W - 240, maxHeight: bodyMaxH, family: serif,
          style: kind === 'quote' ? 'italic 700' : '600', sizes: [72, 64, 56, 48, 42, 38], lh: 1.32,
        });
        let by = bodyTop + body.size;
        body.lines.forEach((ln) => { ctx.fillText(ln, W / 2, by); by += body.size * 1.32; });

        // closing quotation mark for quotes
        if (kind === 'quote') {
          ctx.fillStyle = hexA(GOLD, 0.85);
          ctx.font = `700 150px ${serif}`;
          ctx.fillText('”', W / 2, Math.min(by + 90, H - 450));
        }

        // attribution: small cover + title/author, centered as a group
        const cw = 96;
        const chh = 144;
        const gap = 26;
        ctx.font = `700 40px ${serif}`;
        const titleW = ctx.measureText(book.title).width;
        const groupW = cw + gap + Math.min(titleW, 520);
        const gx = W / 2 - groupW / 2;
        const gy = H - 400;
        drawCover(gx, gy, cw, chh, 8);
        ctx.textAlign = 'left';
        ctx.fillStyle = CREAM;
        ctx.font = `700 40px ${serif}`;
        const tline = fitParagraph(ctx, book.title, {
          maxWidth: 520, maxHeight: 96, family: serif, style: '700', sizes: [40, 34, 30], lh: 1.1,
        });
        let ty = gy + 44;
        tline.lines.slice(0, 2).forEach((ln) => { ctx.fillText(ln, gx + cw + gap, ty); ty += tline.size * 1.1; });
        ctx.fillStyle = hexA(CREAM, 0.8);
        ctx.font = `italic 30px ${serif}`;
        ctx.fillText(book.author, gx + cw + gap, ty + 6);
        ctx.textAlign = 'center';
      }

      drawLogo();
    },
    [book, quote, answer, kind, themeId]
  );

  useEffect(() => {
    const withLogo = (cb) => {
      if (logoImage.complete && logoImage.naturalWidth) cb();
      else { logoImage.onload = cb; logoImage.onerror = cb; }
    };
    if (book?.coverUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => withLogo(() => { draw(img); setReady(true); });
      img.onerror = () => withLogo(() => { draw(null); setReady(true); });
      img.src = book.coverUrl;
    } else {
      withLogo(() => { draw(null); setReady(true); });
    }
  }, [book, draw]);

  const filename = () => {
    const base = kind === 'book' ? book.title : `${book.title}-${kind}`;
    return `${base.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-booknook.png`;
  };

  const toBlob = () =>
    new Promise((resolve) => {
      try {
        canvasRef.current.toBlob((bl) => resolve(bl), 'image/png');
      } catch {
        draw(null);
        canvasRef.current.toBlob((bl) => resolve(bl), 'image/png');
      }
    });

  const download = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename();
    a.click();
    URL.revokeObjectURL(url);
  };

  const nativeShare = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], filename(), { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'BookNook' });
      } else {
        download();
      }
    } catch {
      /* user cancelled */
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.canShare;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-surface rounded-3xl shadow-2xl p-5 max-w-sm w-full animate-in zoom-in-95 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg text-ink">
            {kind === 'book' ? 'Share your read' : kind === 'quote' ? 'Share this quote' : 'Share this reflection'}
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-ink" aria-label="Close"><X size={20} /></button>
        </div>

        <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-2xl border border-stone-200 shadow-sm" />

        {/* Theme picker */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Card theme</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(THEMES).map(([id, t]) => (
              <button
                key={id}
                onClick={() => setThemeId(id)}
                aria-label={t.label}
                title={t.label}
                className={`w-8 h-8 rounded-full transition-transform ${themeId === id ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: t.swatch }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {canNativeShare && (
            <button
              onClick={nativeShare}
              disabled={!ready}
              className="flex-1 bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 disabled:opacity-50 font-semibold py-3 rounded-full flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 size={18} /> Share
            </button>
          )}
          <button
            onClick={download}
            disabled={!ready}
            className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={18} /> Download
          </button>
        </div>
      </div>
    </div>
  );
}

// Letter-spacing for canvas (canvas has no tracking) — inserts thin spaces.
function spaced(s) {
  return s.split('').join(' ');
}
