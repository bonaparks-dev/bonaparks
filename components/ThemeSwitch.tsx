import React, { useRef, useSyncExternalStore } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export type ThemePref = 'light' | 'dark' | 'auto';

declare global {
  interface Window {
    /** Defined by /brand/theme.js, shared with the static app pages. */
    bonaparksTheme?: {
      get: () => ThemePref;
      set: (pref: ThemePref) => void;
      subscribe: (listener: (pref: ThemePref) => void) => () => void;
    };
  }
}

const subscribe = (onChange: () => void) => window.bonaparksTheme?.subscribe(onChange) ?? (() => {});
const getPref = (): ThemePref => window.bonaparksTheme?.get() ?? 'auto';

const ORDER: ThemePref[] = ['light', 'dark', 'auto'];

/** Apple-style Light | Dark | Auto segmented control (a radio group, arrow keys move the choice). */
const ThemeSwitch: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useLanguage();
  const pref = useSyncExternalStore(subscribe, getPref, () => 'auto' as ThemePref);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = (next: ThemePref) => window.bonaparksTheme?.set(next);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = ORDER.indexOf(pref);
    const moves: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowDown: i + 1,
      ArrowLeft: i - 1,
      ArrowUp: i - 1,
      Home: 0,
      End: ORDER.length - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = (moves[e.key] + ORDER.length) % ORDER.length;
    choose(ORDER[next]);
    buttons.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={t.theme.group}
      onKeyDown={onKeyDown}
      className={`inline-flex gap-0.5 rounded-full border border-line bg-surface p-0.5 ${className}`}
    >
      {ORDER.map((value, index) => {
        const checked = pref === value;
        return (
          <button
            key={value}
            ref={(el) => { buttons.current[index] = el; }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => choose(value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold leading-none transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${
              checked ? 'bg-accent text-on-accent' : 'text-muted hover:text-bone'
            }`}
          >
            {t.theme[value]}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitch;
