import { useEffect, useRef, useState } from 'react';
import { Music4, X, Square, Volume2 } from 'lucide-react';
import { AMBIANCES, createAmbiance } from '../../lib/ambiance';

const VOL_KEY = 'booknook_ambient_vol';

/**
 * A small floating ambience player — cozy synthesized background sound (rain,
 * fireplace, ocean…) to read to. Nothing autoplays; sound only starts on tap,
 * satisfying browser autoplay rules. Volume is remembered.
 */
export default function AmbientPlayer() {
  const ctl = useRef(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [volume, setVolume] = useState(() => {
    const v = parseFloat(localStorage.getItem(VOL_KEY));
    return Number.isFinite(v) ? v : 0.5;
  });

  useEffect(() => {
    ctl.current = createAmbiance();
    ctl.current.setVolume(volume);
    return () => ctl.current?.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (id) => {
    if (current === id) { ctl.current.stop(); setCurrent(null); return; }
    ctl.current.play(id);
    setCurrent(id);
  };

  const onVolume = (v) => {
    setVolume(v);
    localStorage.setItem(VOL_KEY, String(v));
    ctl.current?.setVolume(v);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-56 bg-surface border border-stone-200 rounded-2xl shadow-xl p-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Ambience</span>
            {current && (
              <button onClick={() => { ctl.current.stop(); setCurrent(null); }} className="text-xs font-semibold text-status-dnf hover:opacity-80 inline-flex items-center gap-1">
                <Square size={11} /> Stop
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {AMBIANCES.map((a) => (
              <button
                key={a.id}
                onClick={() => choose(a.id)}
                className={`px-2.5 py-2 rounded-xl text-sm font-medium transition-colors ${current === a.id ? 'bg-brand-500 text-white' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 px-1">
            <Volume2 size={15} className="text-stone-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolume(parseFloat(e.target.value))}
              className="w-full accent-brand-500"
              aria-label="Ambience volume"
            />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Ambient sounds"
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${current ? 'bg-brand-500 text-white' : 'bg-surface border border-stone-200 text-stone-500 hover:text-brand-600'}`}
      >
        {open ? <X size={20} /> : <Music4 size={20} className={current ? 'animate-pulse' : ''} />}
      </button>
    </div>
  );
}
