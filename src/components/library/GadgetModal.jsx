import { useState } from 'react';
import { X, Loader2, Sprout, Image as ImageIcon } from 'lucide-react';
import { FRAMES, frameClass } from '../../lib/gadgets';
import { ACCESSORIES, GadgetArt } from '../../lib/gadgetArt';
import { fileToDataUrl } from '../../lib/image';
import { useToast } from '../ui/ToastProvider';
import Button from '../ui/Button';
import { useDialog } from '../../hooks/useDialog';

/**
 * Add a shelf decoration: a plant, or a framed photo the user uploads.
 */
export default function GadgetModal({ onAdd, onClose }) {
  const toast = useToast();
  const dialogRef = useDialog(onClose);
  const [type, setType] = useState('plant');
  const [variant, setVariant] = useState('succulent');
  const [image, setImage] = useState('');
  const [frame, setFrame] = useState('classic');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImage(await fileToDataUrl(file, 600, 0.82));
    } catch (err) {
      toast.error(err.message || 'Could not load image.');
    }
  };

  const add = async () => {
    if (type === 'photo' && !image) {
      toast.error('Upload a photo first.');
      return;
    }
    setBusy(true);
    try {
      await onAdd(
        type === 'plant'
          ? { type: 'plant', variant }
          : { type: 'photo', image, frame, caption }
      );
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not add decoration.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Add a shelf decoration" className="bg-surface w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-ink">Add a shelf decoration</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-ink" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-5">
          {['plant', 'photo'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                type === t ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                {t === 'plant' ? <Sprout size={15} /> : <ImageIcon size={15} />}
                {t === 'plant' ? 'Decor' : 'Photo'}
              </span>
            </button>
          ))}
        </div>

        {type === 'plant' ? (
          <div className="grid grid-cols-3 gap-3">
            {ACCESSORIES.map((a) => (
              <button
                key={a.id}
                onClick={() => setVariant(a.id)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border-2 p-2 transition-all ${
                  variant === a.id ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <GadgetArt variant={a.id} className="h-10 w-auto" />
                <span className="text-[10px] text-stone-500">{a.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={frameClass(frame)}>
                {image ? (
                  <img src={image} alt="preview" className="w-20 h-24 object-cover" />
                ) : (
                  <div className="w-20 h-24 bg-stone-100 flex items-center justify-center text-stone-400 text-xs">Preview</div>
                )}
              </div>
              <label className="flex-1">
                <span className="block text-sm font-semibold text-stone-600 mb-1">Photo</span>
                <input type="file" accept="image/*" onChange={onFile} className="text-sm w-full" />
              </label>
            </div>
            <div>
              <span className="block text-sm font-semibold text-stone-600 mb-2">Frame</span>
              <div className="flex gap-2">
                {FRAMES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFrame(f.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      frame === f.id ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        )}

        <Button onClick={add} disabled={busy} size="lg" className="w-full mt-6 text-sm">
          {busy && <Loader2 size={16} className="animate-spin" />} Add to shelf
        </Button>
      </div>
    </div>
  );
}
