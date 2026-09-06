import React from 'react';

/** Small uppercase label that opens a section. */
export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <span
    className={`inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest2 text-gold ${className}`}
  >
    <span className="h-px w-8 bg-gold/50" aria-hidden="true" />
    {children}
  </span>
);

interface PageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: 'left' | 'center';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  intro,
  align = 'left',
}) => (
  <header className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
    {eyebrow && <Eyebrow className="mb-6">{eyebrow}</Eyebrow>}
    <h1 className="font-display text-5xl md:text-6xl leading-[1.05] text-bone">{title}</h1>
    {intro && <p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p>}
  </header>
);

type ButtonVariant = 'primary' | 'outline' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold tracking-wide transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-40';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-gold text-ink hover:bg-bone',
  outline: 'border border-line text-bone hover:border-gold hover:text-gold',
  ghost: 'text-muted hover:text-bone',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => (
  <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...rest}>
    {children}
  </button>
);

export const LinkButton: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant }
> = ({ variant = 'primary', className = '', children, ...rest }) => (
  <a className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...rest}>
    {children}
  </a>
);

/** Dark panel used for cards, forms and content blocks. */
export const Panel: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}> = ({ children, className = '', hover = false }) => (
  <div
    className={`rounded-2xl border border-line bg-surface ${
      hover ? 'transition-colors duration-300 hover:border-gold/40' : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <span
    className={`inline-block rounded-full border border-line bg-ink/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest2 text-bone backdrop-blur-sm ${className}`}
  >
    {children}
  </span>
);

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  action?: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, action, id, className = '', ...rest }) => (
  <div>
    <div className="mb-2 flex items-baseline justify-between">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest2 text-muted">
        {label}
      </label>
      {action}
    </div>
    <input
      id={id}
      className={`w-full rounded-lg border border-line bg-ink px-4 py-3 text-bone placeholder-muted/60 transition-colors duration-300 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold ${className}`}
      {...rest}
    />
  </div>
);

/** Page wrapper: consistent width, top spacing and entrance animation. */
export const PageShell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`animate-fade-in mx-auto w-full max-w-7xl px-6 md:px-10 ${className}`}>
    {children}
  </div>
);
