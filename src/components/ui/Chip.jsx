/**
 * Shared pill/chip primitive for filters, moods, and tags. `active` fills it with
 * the brand color; otherwise it's an outlined surface pill.
 */
export default function Chip({ active = false, className = '', ...props }) {
  return (
    <button
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-500 text-white'
          : 'bg-surface text-stone-600 border border-stone-200 hover:border-brand-300 hover:text-brand-600'
      } ${className}`}
      {...props}
    />
  );
}
