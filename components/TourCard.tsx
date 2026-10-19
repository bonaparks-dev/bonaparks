import React from 'react';
import { ExperienceItem } from '../types';
import { Badge } from './ui';
import { useLanguage } from '../i18n/LanguageContext';

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';

interface TourCardProps {
  item: ExperienceItem;
  onOpen: () => void;
  /** Label for the action button; defaults to "Enter the tour" in the current language. */
  action?: string;
  /** When set, the card is locked and the reason is shown instead of the action. */
  lockedMessage?: string;
}

const TourCard: React.FC<TourCardProps> = ({
  item,
  onOpen,
  action: actionLabel,
  lockedMessage,
}) => {
  const { t } = useLanguage();
  const action = actionLabel ?? t.tourCard.enter;
  const locked = Boolean(lockedMessage);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors duration-500 hover:border-accent/40">
      <button
        type="button"
        onClick={onOpen}
        disabled={locked}
        data-theme="dark"
        className="relative block aspect-[4/3] w-full overflow-hidden bg-elev focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed"
        aria-label={`${action} — ${item.title}`}
      >
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-80"
          aria-hidden="true"
        />
        <Badge className="absolute left-5 top-5">{item.category}</Badge>
      </button>

      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-display text-3xl leading-tight text-bone">{item.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{item.description}</p>

        {item.metrics && item.metrics.length > 0 && (
          <dl className="mt-6 space-y-2 border-t border-line pt-5">
            {item.metrics.map((metric) => (
              <div key={metric.label} className="flex items-baseline justify-between">
                <dt className="text-xs text-muted">{metric.label}</dt>
                <dd className="font-display text-xl text-accent">{metric.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {locked ? (
          <p className="mt-7 text-xs text-muted">{lockedMessage}</p>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="mt-7 flex items-center gap-3 self-start text-sm font-semibold text-bone transition-colors duration-300 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {action}
            <span
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              &rarr;
            </span>
          </button>
        )}
      </div>
    </article>
  );
};

export default TourCard;
