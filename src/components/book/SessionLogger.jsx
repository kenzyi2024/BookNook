import { useState } from 'react';
import { Clock, Headphones, Hash, Percent, BookMarked, Plus } from 'lucide-react';
import { fmtShortDate, hmsToSeconds, secondsToHms } from '../../lib/format';

const MODES = [
  { id: 'page', label: 'Current page', icon: <BookMarked size={15} /> },
  { id: 'pages', label: 'Pages read', icon: <Hash size={15} /> },
  { id: 'percent', label: 'Percent', icon: <Percent size={15} /> },
  { id: 'audio', label: 'Audiobook', icon: <Headphones size={15} /> },
];

/**
 * Progress + reading-session logger. Supports logging by current page (default),
 * pages read this sitting, raw percentage, or audiobook timestamp. Each log
 * records a session (pages, %, optional minutes) and updates overall progress.
 */
export default function SessionLogger({ book, onUpdate }) {
  const total = book.totalPages || 1;
  const current = parseInt(book.currentPage, 10) || 0;
  const progress = Math.round((current / total) * 100) || 0;

  const [mode, setMode] = useState(book.isAudio ? 'audio' : 'page');
  const [value, setValue] = useState('');
  const [minutes, setMinutes] = useState('');
  const [audioTotal, setAudioTotal] = useState(book.audioDurationSec ? secondsToHms(book.audioDurationSec) : '');
  const [audioAt, setAudioAt] = useState('');

  const sessions = [...(book.sessions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  const computeNewPage = () => {
    if (mode === 'page') return parseInt(value, 10);
    if (mode === 'pages') return current + (parseInt(value, 10) || 0);
    if (mode === 'percent') return Math.round(((parseFloat(value) || 0) / 100) * total);
    if (mode === 'audio') {
      const totalSec = hmsToSeconds(audioTotal);
      const atSec = hmsToSeconds(audioAt);
      if (!totalSec) return NaN;
      return Math.round((atSec / totalSec) * total);
    }
    return NaN;
  };

  const canLog = () => {
    if (mode === 'audio') return hmsToSeconds(audioTotal) > 0 && audioAt.trim() !== '';
    return value.trim() !== '' && !isNaN(parseFloat(value));
  };

  const logSession = () => {
    let newPage = computeNewPage();
    if (isNaN(newPage)) return;
    newPage = Math.min(total, Math.max(0, newPage));

    const pagesRead = Math.max(0, newPage - current);
    const percent = Math.round((pagesRead / total) * 1000) / 10;

    const session = {
      date: new Date().toISOString(),
      endPage: newPage,
      pagesRead,
      percent,
      minutes: parseInt(minutes, 10) || 0,
      format: mode,
    };

    const updates = {
      currentPage: newPage,
      sessions: [...(book.sessions || []), session],
    };

    if (mode === 'audio') {
      updates.isAudio = true;
      updates.audioDurationSec = hmsToSeconds(audioTotal);
    }

    if (newPage >= total && book.status !== 'read') {
      updates.status = 'read';
      updates.finishedAt = new Date().toISOString();
    } else if (newPage > 0 && newPage < total && book.status === 'want_to_read') {
      updates.status = 'reading';
    }

    onUpdate(updates);
    setValue('');
    setMinutes('');
    setAudioAt('');
  };

  return (
    <div className="max-w-2xl animate-in fade-in">
      {/* Progress overview */}
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Progress</h3>
        <span className="text-sm font-semibold text-stone-500">
          {current} / {total} pages · {progress}%
        </span>
      </div>
      <div className="h-4 w-full bg-stone-100 rounded-full shadow-inner overflow-hidden mb-8">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Session logger */}
      <div className="bg-paper border border-stone-200 rounded-2xl p-5">
        <h4 className="font-display font-bold text-lg text-ink mb-3">Log a reading session</h4>

        <div className="flex flex-wrap gap-2 mb-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                mode === m.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-brand-300'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {mode === 'audio' ? (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="text-sm">
              <span className="block text-stone-500 mb-1">Total length (h:m:s)</span>
              <input
                value={audioTotal}
                onChange={(e) => setAudioTotal(e.target.value)}
                placeholder="10:30:00"
                className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </label>
            <label className="text-sm">
              <span className="block text-stone-500 mb-1">You're at (h:m:s)</span>
              <input
                value={audioAt}
                onChange={(e) => setAudioAt(e.target.value)}
                placeholder="3:15:00"
                className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </label>
          </div>
        ) : (
          <div className="mb-3">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                mode === 'page'
                  ? `New current page (of ${total})`
                  : mode === 'pages'
                    ? 'Pages read this session'
                    : 'Percent complete (0–100)'
              }
              className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-stone-500 flex-1">
            <Clock size={15} />
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="Minutes (optional)"
              className="w-full bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </label>
          <button
            onClick={logSession}
            disabled={!canLog()}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Log
          </button>
        </div>
      </div>

      {/* History */}
      {sessions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Reading history
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {sessions.map((s, i) => (
              <div
                key={s._id || i}
                className="flex items-center justify-between bg-white border border-stone-100 rounded-xl px-4 py-2.5 text-sm"
              >
                <span className="text-stone-500">{fmtShortDate(s.date)}</span>
                <span className="text-ink font-medium">
                  {s.format === 'audio' ? '🎧 ' : ''}
                  {s.pagesRead} pages{s.percent ? ` · ${s.percent}%` : ''}
                  {s.minutes ? ` · ${s.minutes} min` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
