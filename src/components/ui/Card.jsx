/** Shared surface card with an optional icon + title header. */
export default function Card({ title, icon, children, className = '' }) {
  return (
    <div className={`bg-surface p-6 rounded-2xl shadow-sm border border-stone-200/70 ${className}`}>
      {title && (
        <h3 className="text-base font-display font-semibold text-ink mb-5 flex items-center gap-2">
          {icon} {title}
        </h3>
      )}
      {children}
    </div>
  );
}
