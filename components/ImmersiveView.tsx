import React, { useState, useEffect } from 'react';
import { LoadingIcon } from './IconComponents';
import { tourEmbedUrl } from '../data/tours';
import { useLanguage } from '../i18n/LanguageContext';

interface ImmersiveViewProps {
  item: {
    title: string;
    category?: string;
    imageUrl: string;
    matterportUrl?: string;
  };
  onExit: () => void;
}

/** Pulls the Matterport model id out of any share/embed link. */
const modelIdFrom = (url?: string) => url?.match(/m=([a-zA-Z0-9]+)/)?.[1] ?? null;

const ImmersiveView: React.FC<ImmersiveViewProps> = ({ item, onExit }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onExit]);

  const modelId = modelIdFrom(item.matterportUrl);
  const embedUrl = modelId ? tourEmbedUrl(modelId) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="immersive-view-title"
    >
      <div className="flex items-center justify-between gap-6 border-b border-line px-6 py-4 md:px-10">
        <div className="min-w-0">
          {item.category && (
            <p className="text-[10px] font-semibold uppercase tracking-widest2 text-gold">
              {item.category}
            </p>
          )}
          <h2
            id="immersive-view-title"
            className="truncate font-display text-2xl leading-tight text-bone md:text-3xl"
          >
            {item.title}
          </h2>
        </div>

        <div className="flex flex-shrink-0 items-center gap-4">
          {item.matterportUrl && (
            <a
              href={item.matterportUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden text-xs font-semibold uppercase tracking-widest2 text-muted transition-colors hover:text-gold sm:block"
            >
              {t.viewer.fullScreen}
            </a>
          )}
          <button
            onClick={onExit}
            className="rounded-full border border-line px-6 py-2 text-sm font-semibold text-bone transition-colors duration-300 hover:border-gold hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label={t.viewer.closeLabel}
          >
            {t.viewer.close}
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        {embedUrl ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-ink">
                <LoadingIcon />
                <span className="text-xs font-semibold uppercase tracking-widest2 text-muted">
                  {t.viewer.loading}
                </span>
              </div>
            )}
            <iframe
              src={embedUrl}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen; web-share; xr-spatial-tracking; vr; accelerometer; gyroscope"
              allowFullScreen
              title={t.viewer.iframeTitle(item.title)}
              onLoad={() => setIsLoading(false)}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="max-h-[50vh] w-auto rounded-2xl border border-line object-contain"
            />
            <p className="text-sm text-muted">
              {t.viewer.noTour}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-line px-6 py-3 text-center">
        <p className="text-[11px] uppercase tracking-widest2 text-muted">
          {t.viewer.hint}
        </p>
      </div>
    </div>
  );
};

export default ImmersiveView;
