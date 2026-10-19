import React, { useState } from 'react';
import { ExperienceItem } from '../../types';
import ImmersiveView from '../ImmersiveView';
import TourCard from '../TourCard';
import { PageHeader, PageShell, LinkButton } from '../ui';
import { tourItemsFor } from '../../data/tours';
import { useLanguage } from '../../i18n/LanguageContext';

interface ProofOfWorkPageProps {
  isLoggedIn: boolean;
}

const ProofOfWorkPage: React.FC<ProofOfWorkPageProps> = () => {
  const { lang, t } = useLanguage();
  const [immersiveItem, setImmersiveItem] = useState<ExperienceItem | null>(null);
  const tourItems = tourItemsFor(lang);

  const categories = Array.from(new Set(tourItems.map((item) => item.category)));

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow={t.gallery.eyebrow}
          title={t.gallery.title}
          intro={t.gallery.intro}
        />

        {categories.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3">
            {categories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-line px-4 py-1.5 text-[13px] font-semibold text-muted"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {tourItems.length > 0 ? (
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tourItems.map((item) => (
              <TourCard key={item.title} item={item} onOpen={() => setImmersiveItem(item)} />
            ))}
          </div>
        ) : (
          <p className="mt-14 text-sm text-muted">{t.gallery.empty}</p>
        )}

        <section className="mt-28 flex flex-wrap items-center justify-between gap-8 rounded-3xl border border-line bg-surface p-10 md:p-14">
          <div>
            <h2 className="font-display text-3xl leading-tight text-bone md:text-4xl">
              {t.gallery.ctaTitle}
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              {t.gallery.ctaBody}
            </p>
          </div>
          <LinkButton href="mailto:contact@bonaparks.com">{t.gallery.ctaButton}</LinkButton>
        </section>
      </PageShell>

      {immersiveItem && (
        <ImmersiveView item={immersiveItem} onExit={() => setImmersiveItem(null)} />
      )}
    </>
  );
};

export default ProofOfWorkPage;
