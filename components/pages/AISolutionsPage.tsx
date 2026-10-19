import React from 'react';
import { Page } from '../../App';
import { PageHeader, PageShell, Button } from '../ui';
import { useLanguage } from '../../i18n/LanguageContext';

const AISolutionsPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const solutions = t.technology.solutions;
  return (
  <PageShell>
    <PageHeader
      eyebrow={t.technology.eyebrow}
      title={t.technology.title}
      intro={t.technology.intro}
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
          {t.technology.ctaTitle}
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
          {t.technology.ctaBody}
        </p>
      </div>
      <Button onClick={() => onNavigate('business-studio')}>{t.technology.ctaButton}</Button>
    </section>
  </PageShell>
  );
};

export default AISolutionsPage;
