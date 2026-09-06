import React, { useState } from 'react';
import { ExperienceItem } from '../../types';
import ImmersiveView from '../ImmersiveView';
import TourCard from '../TourCard';
import { PageHeader, PageShell, LinkButton } from '../ui';
import { tourItems } from '../../data/tours';

interface ProofOfWorkPageProps {
  isLoggedIn: boolean;
}

const ProofOfWorkPage: React.FC<ProofOfWorkPageProps> = () => {
  const [immersiveItem, setImmersiveItem] = useState<ExperienceItem | null>(null);

  const categories = Array.from(new Set(tourItems.map((item) => item.category)));

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow="Gallery"
          title="Every space we have captured"
          intro="A complete archive of our 3D captures. Open any one of them and explore it as if you were standing inside."
        />

        {categories.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3">
            {categories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-line px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest2 text-muted"
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
          <p className="mt-14 text-sm text-muted">No tours published yet.</p>
        )}

        <section className="mt-28 flex flex-wrap items-center justify-between gap-8 rounded-3xl border border-line bg-surface p-10 md:p-14">
          <div>
            <h2 className="font-display text-3xl leading-tight text-bone md:text-4xl">
              Your space belongs in here.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              Tell us what you want to show and we will handle the capture, the editing and the
              hosting.
            </p>
          </div>
          <LinkButton href="mailto:contact@bonaparks.com">Book a scan</LinkButton>
        </section>
      </PageShell>

      {immersiveItem && (
        <ImmersiveView item={immersiveItem} onExit={() => setImmersiveItem(null)} />
      )}
    </>
  );
};

export default ProofOfWorkPage;
