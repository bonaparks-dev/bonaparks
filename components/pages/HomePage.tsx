import React, { useState } from 'react';
import { ExperienceItem } from '../../types';
import { Page } from '../../App';
import ImmersiveView from '../ImmersiveView';
import TourCard from '../TourCard';
import { Eyebrow, Button, LinkButton, PageShell } from '../ui';
import { tourItemsFor, tourThumbUrl, tours } from '../../data/tours';
import { useLanguage } from '../../i18n/LanguageContext';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  isLoggedIn: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { lang, t } = useLanguage();
  const [selectedItem, setSelectedItem] = useState<ExperienceItem | null>(null);

  const tourItems = tourItemsFor(lang);
  const featured = tours[0];
  const featuredItem = tourItems[0];
  const capabilities = t.home.steps;

  return (
    <>
      <PageShell>
        {/* Hero */}
        <section className="animate-rise">
          <Eyebrow>{t.home.eyebrow}</Eyebrow>
          <h1 className="mt-8 max-w-4xl font-display text-6xl leading-[1.02] text-bone md:text-8xl">
            {t.home.title}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">
            {t.home.intro}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button onClick={() => onNavigate('proof-of-work')}>{t.home.seeGallery}</Button>
            <LinkButton variant="outline" href="mailto:contact@bonaparks.com">
              {t.home.getScanned}
            </LinkButton>
          </div>
        </section>

        {/* Featured tour */}
        {featured && featuredItem && (
          <section className="mt-24 animate-rise" style={{ animationDelay: '120ms' }}>
            <button
              type="button"
              onClick={() => setSelectedItem(featuredItem)}
              className="group relative block aspect-[16/9] w-full overflow-hidden rounded-3xl border border-line bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`${t.tourCard.enter} — ${featuredItem.title}`}
            >
              <img
                src={featured.imageUrl ?? tourThumbUrl(featured.id)}
                alt=""
                className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 p-8 text-left md:p-12">
                <p className="text-[11px] font-semibold uppercase tracking-widest2 text-accent">
                  {t.home.featured} &middot; {featuredItem.category}
                </p>
                <h2 className="mt-3 font-display text-4xl text-bone md:text-5xl">
                  {featuredItem.title}
                </h2>
                <span className="mt-5 inline-flex items-center gap-3 text-sm font-semibold text-bone">
                  {t.tourCard.enter}
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                    &rarr;
                  </span>
                </span>
              </div>
            </button>
          </section>
        )}

        {/* All tours */}
        <section className="mt-28">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
            <div>
              <Eyebrow>{t.home.collectionEyebrow}</Eyebrow>
              <h2 className="mt-5 font-display text-4xl text-bone md:text-5xl">
                {t.home.collectionTitle}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {t.home.collectionIntro}
            </p>
          </div>

          {tourItems.length > 0 ? (
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {tourItems.map((item) => (
                <TourCard key={item.title} item={item} onOpen={() => setSelectedItem(item)} />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-sm text-muted">{t.home.empty}</p>
          )}
        </section>

        {/* How it works */}
        <section className="mt-28">
          <Eyebrow>{t.home.howEyebrow}</Eyebrow>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {capabilities.map((step, index) => (
              <div key={step.title} className="bg-surface p-9">
                <span className="font-display text-3xl text-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 font-display text-2xl text-bone">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-28 rounded-3xl border border-line bg-surface px-8 py-16 text-center md:px-16 md:py-20">
          <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight text-bone md:text-5xl">
            {t.home.ctaTitle}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
            {t.home.ctaBody}
          </p>
          <LinkButton className="mt-10" href="mailto:contact@bonaparks.com">
            {t.home.ctaButton}
          </LinkButton>
        </section>
      </PageShell>

      {selectedItem && (
        <ImmersiveView item={selectedItem} onExit={() => setSelectedItem(null)} />
      )}
    </>
  );
};

export default HomePage;
