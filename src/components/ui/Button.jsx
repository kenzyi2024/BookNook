/**
 * Shared button primitive. One place for button roles + sizes so they stay
 * consistent. Visually matches the styles already used across the app.
 *
 *   variant: primary | secondary | soft | ghost | danger
 *   size:    sm | md | lg | icon
 *   pill:    true → rounded-full (default), false → rounded-xl
 */

const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm',
  secondary: 'bg-surface border border-stone-200 text-stone-600 hover:border-brand-300',
  soft: 'bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100',
  ghost: 'text-stone-500 hover:text-brand-600 hover:bg-stone-100',
  danger: 'text-status-dnf hover:bg-red-50',
};

const SIZES = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
  icon: 'p-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  pill = true,
  className = '',
  as: As = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const radius = pill ? 'rounded-full' : 'rounded-xl';
  return <As className={`${base} ${radius} ${SIZES[size]} ${VARIANTS[variant]} ${className}`} {...props} />;
}
