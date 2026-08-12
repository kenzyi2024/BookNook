import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, XCircle, BookOpen, Edit3, Sparkles, Share2 } from 'lucide-react';
import StarRating from '../ui/StarRating';
import ConfirmDialog from '../ui/ConfirmDialog';
import AIToolsView from './AIToolsView';
import SessionLogger from './SessionLogger';
import NotesJournal from './NotesJournal';
import ShareCard from './ShareCard';
import { STATUS_OPTIONS } from '../../lib/status';
import { resolveCover } from '../../lib/covers';

/**
 * Full-page view for one book: cover, metadata, status/rating controls, and the
 * Progress / Notes / AI tabs, plus a shareable finish card.
 */
export default function BookDetailView({ book, onUpdate, onBack, onDelete }) {
  const [activeSubTab, setActiveSubTab] = useState('progress');
  const [coverUrl, setCoverUrl] = useState(book.coverUrl || '');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [ratingInput, setRatingInput] = useState(book.rating ? String(book.rating) : '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const hasAttemptedFetch = useRef(false);

  useEffect(() => {
    if (book.coverUrl || hasAttemptedFetch.current) return;
    hasAttemptedFetch.current = true;
    resolveCover(book.title, book.author, '').then((r) => {
      if (r.coverUrl) {
        setCoverUrl(r.coverUrl);
        onUpdate({ coverUrl: r.coverUrl, spineColor: r.spineColor });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.title, book.author, book.coverUrl]);

  const handleRatingChange = (val) => {
    setRatingInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 5) onUpdate({ rating: num });
  };

  const handleStatusChange = (status) => {
    const updates = { status };
    if (status === 'read') {
      if (!book.finishedAt) updates.finishedAt = new Date().toISOString();
      if (book.currentPage < book.totalPages) updates.currentPage = book.totalPages;
    }
    onUpdate(updates);
  };

  const tabs = [
    { id: 'progress', icon: <BookOpen size={18} />, label: 'Progress' },
    { id: 'notes', icon: <Edit3 size={18} />, label: 'Notes' },
    { id: 'ai', icon: <Sparkles size={18} />, label: 'AI Tools' },
  ];

  return (
    <div className="max-w-4xl mx-auto mt-2 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-stone-500 hover:text-brand-600 transition-colors font-medium text-sm">
          <ArrowLeft size={16} /> Back to Library
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex items-center gap-2 text-status-dnf hover:brightness-90 transition-all font-semibold text-sm px-3 py-1.5 rounded-full hover:bg-red-50"
        >
          <XCircle size={16} /> Delete Book
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8 bg-surface p-6 rounded-3xl shadow-sm border border-stone-100">
        <div
          className={`w-48 h-72 rounded-md shadow-2xl flex-shrink-0 flex items-center justify-center p-4 relative overflow-hidden ${coverUrl ? '' : book.coverColor}`}
          style={!coverUrl && book.spineColor ? { backgroundColor: book.spineColor } : undefined}
        >
          {coverUrl ? (
            <>
              {/* colored placeholder that pulses until the cover decodes, then fades out */}
              <div
                className={`absolute inset-0 z-10 ${book.coverColor} ${imgLoaded ? 'opacity-0' : 'animate-pulse'} transition-opacity duration-500`}
                style={book.spineColor ? { backgroundColor: book.spineColor } : undefined}
              />
              <img
                src={coverUrl}
                alt={`Cover of ${book.title}`}
                onLoad={() => setImgLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover z-20 transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </>
          ) : (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20" />
              <h2 className="text-white text-xl font-display font-bold text-center z-10 leading-snug break-words drop-shadow-md">
                {book.title}
              </h2>
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-ink mb-2 leading-tight">{book.title}</h1>
          <p className="text-xl text-stone-600 font-display italic mb-4">{book.author}</p>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select
              value={book.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-stone-100 border border-stone-200 text-ink text-sm rounded-full px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span className="text-stone-500 text-sm font-medium px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
              {book.isAudio ? '🎧 ' : ''}{book.totalPages} pages
            </span>
            {book.genre && (
              <span className="text-stone-500 text-sm font-medium px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
                {book.genre}
              </span>
            )}
            {book.status === 'read' && (
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
              >
                <Share2 size={15} /> Share
              </button>
            )}
          </div>

          {(book.status === 'read' || book.status === 'dnf') && (
            <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100 w-max">
              <span className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Your Rating:</span>
              <StarRating value={book.rating || 0} />
              <input
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={ratingInput}
                onChange={(e) => handleRatingChange(e.target.value)}
                className="w-20 bg-surface border border-stone-200 rounded-lg p-2 text-center font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-stone-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
              activeSubTab === tab.id
                ? 'border-brand-500 text-brand-700'
                : 'border-transparent text-stone-400 hover:text-stone-600 hover:border-stone-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-stone-100 min-h-[400px]">
        {activeSubTab === 'progress' && <SessionLogger book={book} onUpdate={onUpdate} />}
        {activeSubTab === 'notes' && <NotesJournal book={book} onUpdate={onUpdate} />}
        {activeSubTab === 'ai' && <AIToolsView book={book} onUpdate={onUpdate} />}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        danger
        title="Delete this book?"
        message={`"${book.title}" will be permanently removed from your library.`}
        confirmLabel="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete(book._id);
        }}
      />

      {shareOpen && <ShareCard book={book} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
