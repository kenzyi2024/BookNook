import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Music, Check } from 'lucide-react';
import { createAmbiance, AMBIANCES } from '../../lib/ambiance';
import { toEmbedUrl } from '../../lib/embed';

const PLAYLIST_KEY = 'booknook_playlist';

/**
 * Full-screen BookNook reading focus timer: count-up stopwatch, built-in
 * ambiance (Web Audio), optional Spotify/YouTube embed, and silent mode.
 * On finish it logs a session (minutes + optional pages) for metrics & streak.
 */
export default function ReadingTimer({ book, onClose, onLogSession }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [amb, setAmb] = useState(null); // active ambiance id
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [playlist, setPlaylist] = useState(() => localStorage.getItem(PLAYLIST_KEY) || '');
  const [pages, setPages] = useState('');

  const tick = useRef(null);
  const ambiance = useRef(null);
  if (ambiance.current == null) {
    ambiance.current = createAmbiance();
  }

  // Stopwatch
  useEffect(() => {
    if (running) {
      tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(tick.current);
  }, [running]);

  // Clean up audio on unmount
  useEffect(() => {
    const a = ambiance.current;
    return () => a && a.dispose();
  }, []);

  const chooseAmb = (id) => {
    const next = amb === id ? null : id;
    setAmb(next);
    if (!next || muted) ambiance.current.stop();
    else {
      ambiance.current.setVolume(volume);
      ambiance.current.play(next);
    }
  };

  const onVolume = (v) => {
    setVolume(v);
    ambiance.current.setVolume(v);
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    if (m) ambiance.current.stop();
    else if (amb) {
      ambiance.current.setVolume(volume);
      ambiance.current.play(amb);
    }
  };

  const savePlaylist = (val) => {
    setPlaylist(val);
    localStorage.setItem(PLAYLIST_KEY, val);
  };

  const mmss = () => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const finish = () => {
    const minutes = Math.round(seconds / 60);
    ambiance.current.stop();
    onLogSession(minutes, parseInt(pages, 10) || 0);
    onClose();
  };

  const embed = toEmbedUrl(playlist);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse at top, #7A3A14, #2A1608 70%)' }}
    >
      <button
        onClick={() => { ambiance.current.stop(); onClose(); }}
        className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors"
        aria-label="Close timer"
      >
        <X size={26} />
      </button>

      <div className="w-full max-w-md px-6 py-10 flex flex-col items-center text-center gap-6">
        <div>
          <p className="text-amber-200/70 text-sm uppercase tracking-widest mb-1">Reading</p>
          <h2 className="font-display font-bold text-2xl text-amber-50 leading-snug">{book.title}</h2>
        </div>

        {/* Timer dial */}
        <div className="w-56 h-56 rounded-full border-4 border-amber-200/20 flex items-center justify-center bg-black/20 shadow-2xl">
          <span className="font-display font-bold text-5xl text-amber-50 tabular-nums">{mmss()}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="bg-amber-100 text-[#7A3A14] font-bold px-8 py-3 rounded-full flex items-center gap-2 hover:bg-white transition-colors shadow-lg"
          >
            {running ? <Pause size={20} /> : <Play size={20} />} {running ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={() => { setSeconds(0); setRunning(false); }}
            className="text-amber-100/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Reset"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Ambiance */}
        <div className="w-full bg-black/20 rounded-2xl p-4 border border-amber-200/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-amber-100/80 text-sm font-semibold">Ambiance</span>
            <button onClick={toggleMute} className="text-amber-100/80 hover:text-white" aria-label="Mute">
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {AMBIANCES.map((a) => (
              <button
                key={a.id}
                onClick={() => chooseAmb(a.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  amb === a.id && !muted
                    ? 'bg-amber-100 text-[#7A3A14] font-semibold'
                    : 'bg-white/10 text-amber-50 hover:bg-white/20'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolume(parseFloat(e.target.value))}
            className="w-full accent-amber-300"
            aria-label="Ambiance volume"
          />
        </div>

        {/* Music embed */}
        <div className="w-full bg-black/20 rounded-2xl p-4 border border-amber-200/10">
          <div className="flex items-center gap-2 mb-3 text-amber-100/80 text-sm font-semibold">
            <Music size={16} /> Music (optional)
          </div>
          <input
            value={playlist}
            onChange={(e) => savePlaylist(e.target.value)}
            placeholder="Paste a Spotify or YouTube link…"
            className="w-full bg-white/10 text-amber-50 placeholder:text-amber-100/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 mb-3"
          />
          {embed && (
            <iframe
              title="playlist"
              src={embed.url}
              className="w-full rounded-xl"
              height={embed.kind === 'spotify' ? 152 : 180}
              frameBorder="0"
              allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
            />
          )}
        </div>

        {/* Finish */}
        <div className="w-full flex items-center gap-3">
          <input
            type="number"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="Pages read (optional)"
            className="flex-1 bg-white/10 text-amber-50 placeholder:text-amber-100/40 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            onClick={finish}
            disabled={seconds === 0}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Check size={18} /> Finish
          </button>
        </div>
        <p className="text-amber-100/50 text-xs">Your time counts toward your stats and reading streak.</p>
      </div>
    </div>
  );
}
