import React from 'react';
import { Page } from '../../App';
import { PageHeader, PageShell, Button } from '../ui';

const solutions = [
  {
    title: 'Millimetre capture',
    description:
      'Laser and photogrammetric scanning produce a dimensionally accurate model, not a stitched panorama. Measure anything, from anywhere.',
  },
  {
    title: 'Dynamic NPCs',
    description:
      'Our characters and guides are powered by advanced AI, allowing for natural conversations and unique interactions.',
  },
  {
    title: 'Personalized experiences',
    description:
      'Our platform learns your preferences to recommend events, venues, and art that you will love.',
  },
  {
    title: 'Interactive worlds',
    description:
      'From AI-generated art to responsive environments, our tech creates a living world that reacts to you.',
  },
];

const AISolutionsPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => (
  <PageShell>
    <PageHeader
      eyebrow="Technology"
      title="The tech behind the tour"
      intro="Precision capture on one side, artificial intelligence on the other. Together they make a virtual space feel less like a photo and more like a visit."
    />

    <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
      {solutions.map((solution) => (
        <div key={solution.title} className="bg-surface p-9 md:p-11">
          <h2 className="font-display text-2xl text-bone md:text-3xl">{solution.title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">{solution.description}</p>
        </div>
      ))}
    </div>

    <section className="mt-24 flex flex-wrap items-center justify-between gap-8 rounded-3xl border border-line bg-surface p-10 md:p-14">
      <div>
        <h2 className="font-display text-3xl leading-tight text-bone md:text-4xl">
          Curious how this fits your venue?
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
          The Business Studio walks you through the live demos and lets you send us a brief.
        </p>
      </div>
      <Button onClick={() => onNavigate('business-studio')}>Open Business Studio</Button>
    </section>
  </PageShell>
);

export default AISolutionsPage;
