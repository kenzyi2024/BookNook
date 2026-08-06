import { useRef, useEffect, useState, useCallback } from 'react';
import { Download, X } from 'lucide-react';
import { fmtDate } from '../../lib/format';

// Map the stored Tailwind spine classes to hex for canvas drawing.
const COLOR_HEX = {
  'bg-amber-700': '#b45309',
  'bg-red-800': '#991b1b',
  'bg-blue-800': '#1e40af',
  'bg-emerald-800': '#065f46',
  'bg-purple-900': '#581c87',
  'bg-slate-800': '#1e293b',
  'bg-stone-800': '#292524',
  'bg-teal-700': '#0f766e',
  'bg-orange-800': '#9a3412',
};

const W = 1080;
const H = 1350;

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * A downloadable "finished a book" card, drawn on a canvas so it exports as a
 * clean PNG with no cross-origin issues.
 */
export default function ShareCard({ book, onClose }) {
  const canvasRef = useRef(null);
  // No cover → drawn synchronously in the effect, so it's ready immediately.
  const [ready, setReady] = useState(!book.coverUrl);

  const draw = useCallback(
    (coverImg) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Warm gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#A34B18');
      grad.addColorStop(1, '#3D1B08');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Subtle border frame
      ctx.strokeStyle = 'rgba(251,247,239,0.25)';
      ctx.lineWidth = 3;
      ctx.strokeRect(48, 48, W - 96, H - 96);

      const cream = '#FBF7EF';
      const gold = '#E8B04B';

      // Header label
      ctx.fillStyle = 'rgba(251,247,239,0.7)';
      ctx.font = '600 34px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('· FINISHED READING ·', W / 2, 150);

      // Cover: real image if available, else colored spine block
      const cw = 200;
      const ch = 300;
      const cx = W / 2 - cw / 2;
      const cy = 185;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(cx + 10, cy + 10, cw, ch); // shadow
      if (coverImg) {
        ctx.drawImage(coverImg, cx, cy, cw, ch);
        ctx.strokeStyle = 'rgba(251,247,239,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx, cy, cw, ch);
      } else {
        ctx.fillStyle = COLOR_HEX[book.coverColor] || '#A34B18';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(cx, cy, 10, ch);
      }

      // Title (wrapped)
    ctx.fillStyle = cream;
    ctx.font = '700 76px Georgia, serif';
    const titleLines = wrapText(ctx, book.title, W - 200).slice(0, 3);
    let y = 590;
    titleLines.forEach((ln) => {
      ctx.fillText(ln, W / 2, y);
      y += 88;
    });

    // Author
    ctx.fillStyle = 'rgba(251,247,239,0.85)';
    ctx.font = 'italic 40px Georgia, serif';
    ctx.fillText(book.author, W / 2, y + 20);
    y += 90;

    // Rating stars
    const rating = book.rating || 0;
    ctx.font = '58px Georgia, serif';
    const starTotal = 5;
    const starStr = '★'.repeat(starTotal);
    // gray base
    ctx.fillStyle = 'rgba(251,247,239,0.25)';
    ctx.fillText(starStr, W / 2, y + 30);
    // gold overlay clipped to rating fraction
    const starW = ctx.measureText(starStr).width;
    const fillW = (rating / starTotal) * starW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(W / 2 - starW / 2, y - 40, fillW, 100);
    ctx.clip();
    ctx.fillStyle = gold;
    ctx.fillText(starStr, W / 2, y + 30);
    ctx.restore();
    if (rating) {
      ctx.fillStyle = gold;
      ctx.font = '600 34px Georgia, serif';
      ctx.fillText(`${rating.toFixed(1)} / 5`, W / 2, y + 90);
    }
    y += 140;

    // Stats row
    const drawStat = (label, val, cx) => {
      ctx.fillStyle = cream;
      ctx.font = '700 60px Georgia, serif';
      ctx.fillText(String(val), cx, y + 40);
      ctx.fillStyle = 'rgba(251,247,239,0.7)';
      ctx.font = '28px Georgia, serif';
      ctx.fillText(label, cx, y + 90);
    };
    drawStat('PAGES', book.totalPages, W / 2 - 200);
    drawStat('GENRE', (book.genre || '—').slice(0, 12), W / 2 + 200);
    ctx.fillStyle = 'rgba(251,247,239,0.2)';
    ctx.fillRect(W / 2 - 1, y, 2, 100);

    // Finished date
    if (book.finishedAt) {
      ctx.fillStyle = 'rgba(251,247,239,0.75)';
      ctx.font = '30px Georgia, serif';
      ctx.fillText(`Finished ${fmtDate(book.finishedAt)}`, W / 2, H - 150);
    }

      // Wordmark
      ctx.fillStyle = gold;
      ctx.font = '700 40px Georgia, serif';
      ctx.fillText('📚 BookNook', W / 2, H - 90);
    },
    [book]
  );

  useEffect(() => {
    if (book.coverUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // OpenLibrary allows CORS, so the export stays clean
      img.onload = () => {
        draw(img);
        setReady(true);
      };
      img.onerror = () => {
        draw(null); // fall back to the colored spine
        setReady(true);
      };
      img.src = book.coverUrl;
    } else {
      draw(null);
    }
  }, [book, draw]);

  const download = () => {
    let url;
    try {
      url = canvasRef.current.toDataURL('image/png');
    } catch {
      // Cover tainted the canvas (no CORS) — redraw without it and export.
      draw(null);
      url = canvasRef.current.toDataURL('image/png');
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-booknook.png`;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-3xl shadow-2xl p-5 max-w-sm w-full animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg text-ink">Share your read</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full rounded-2xl border border-stone-200 shadow-sm"
        />
        <button
          onClick={download}
          disabled={!ready}
          className="w-full mt-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2 transition-colors"
        >
          <Download size={18} /> Download image
        </button>
      </div>
    </div>
  );
}
