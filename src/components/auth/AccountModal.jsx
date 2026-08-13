import { useState, useRef } from 'react';
import { X, Camera, Check, Loader2, Moon, Sun, Wand2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../ui/ToastProvider';
import { THEMES } from '../../lib/themes';
import { fileToDataUrl } from '../../lib/image';

/**
 * Account & personalization: profile picture, display name, and theme picker.
 */
export default function AccountModal({ onClose, onToggleSample, sampleLoaded, sampleBusy }) {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme, dark, toggleDark } = useTheme();
  const toast = useToast();
  const fileRef = useRef(null);

  const [name, setName] = useState(user?.name || user?.username || '');
  const [pic, setPic] = useState(user?.profilePicture || '');
  const [busy, setBusy] = useState(false);

  const initial = (name || user?.email || '?').charAt(0).toUpperCase();

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file, 256, 0.85);
      setPic(dataUrl);
      await updateProfile({ profilePicture: dataUrl });
      toast.success('Photo updated.');
    } catch (err) {
      toast.error(err.message || 'Could not update photo.');
    }
  };

  const saveName = async () => {
    setBusy(true);
    try {
      await updateProfile({ name });
      toast.success('Profile saved.');
    } catch (err) {
      toast.error(err.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const chooseTheme = async (id) => {
    setTheme(id);
    try {
      await updateProfile({ theme: id });
    } catch {
      /* theme still applied locally */
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-xl text-ink">Account & appearance</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-ink" aria-label="Close"><X size={20} /></button>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden bg-brand-500 text-white flex items-center justify-center group shrink-0"
            aria-label="Change photo"
          >
            {pic ? (
              <img src={pic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-bold text-2xl">{initial}</span>
            )}
            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={20} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
          <div className="min-w-0">
            <p className="text-sm text-stone-500">Signed in as</p>
            <p className="font-medium text-ink truncate">{user?.email}</p>
            <button onClick={() => fileRef.current?.click()} className="text-sm text-brand-600 font-semibold hover:underline mt-0.5">
              Change photo
            </button>
          </div>
        </div>

        {/* Name */}
        <label className="block text-sm font-semibold text-stone-500 uppercase tracking-wider mb-1">Display name</label>
        <div className="flex gap-2 mb-6">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button onClick={saveName} disabled={busy} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-4 rounded-xl flex items-center gap-2">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
          </button>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="w-full flex items-center justify-between gap-2 mb-5 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 hover:border-brand-300 transition-colors"
          role="switch"
          aria-checked={dark}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            {dark ? <Sun size={16} /> : <Moon size={16} />} Dark mode
          </span>
          <span className={`relative w-10 h-5 rounded-full transition-colors ${dark ? 'bg-brand-500' : 'bg-stone-300'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${dark ? 'left-5' : 'left-0.5'}`} />
          </span>
        </button>

        {/* Theme picker */}
        <label className="block text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2">Color theme</label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(THEMES).map(([id, t]) => (
            <button
              key={id}
              onClick={() => chooseTheme(id)}
              className={`rounded-2xl p-3 border-2 transition-all flex flex-col items-center gap-2 ${
                theme === id ? 'border-brand-500 shadow-sm' : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <span className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: t.swatch }} />
              <span className="text-xs font-medium text-stone-600">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Sample / demo data toggle */}
        {onToggleSample && (
          <div className="mt-6 pt-5 border-t border-stone-100">
            <button
              onClick={onToggleSample}
              disabled={sampleBusy}
              role="switch"
              aria-checked={sampleLoaded}
              className="w-full flex items-center justify-between gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 hover:border-brand-300 transition-colors disabled:opacity-60"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                {sampleBusy ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                Sample library
              </span>
              <span className={`relative w-10 h-5 rounded-full transition-colors ${sampleLoaded ? 'bg-brand-500' : 'bg-stone-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${sampleLoaded ? 'left-5' : 'left-0.5'}`} />
              </span>
            </button>
            <p className="text-xs text-stone-400 mt-1.5 px-1">
              Fills your library with demo books, reading sessions, notes and gadgets. Toggle off to remove exactly what it added.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
