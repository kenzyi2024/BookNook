/**
 * One consistent page header for every tab — an icon in a soft brand badge, a
 * title, an optional subtitle, and an optional right-aligned action. Keeps the
 * app's headers aligned and on-brand instead of five slightly different blocks.
 */
export default function PageHeader({ icon: Icon, title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="shrink-0 w-11 h-11 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <Icon size={22} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display font-bold text-2xl md:text-3xl leading-tight text-ink tracking-tight truncate">
            {title}
          </h1>
          {subtitle ? <p className="text-sm text-stone-500 mt-0.5 truncate">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0 flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
