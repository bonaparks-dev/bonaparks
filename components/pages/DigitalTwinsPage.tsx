import React, { useState } from 'react';
import ImmersiveView from '../ImmersiveView';
import TourCard from '../TourCard';
import { ExperienceItem } from '../../types';
import { PageHeader, PageShell } from '../ui';
import { useLanguage } from '../../i18n/LanguageContext';

/** Venue names are proper names; categories and descriptions come from the dictionary (same order). */
const digitalTwinShowcases: Pick<ExperienceItem, 'title' | 'imageUrl'>[] = [
  {
    title: 'The Onyx Lounge',
    imageUrl: 'https://images.pexels.com/photos/2114365/pexels-photo-2114365.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    title: 'Starlight Social Club',
    imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    title: 'Bloom Museum Wing',
    imageUrl: 'https://images.pexels.com/photos/932638/pexels-photo-932638.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
];

interface DigitalTwinsPageProps {
  isLoggedIn: boolean;
}

const DigitalTwinsPage: React.FC<DigitalTwinsPageProps> = ({ isLoggedIn }) => {
  const { t } = useLanguage();
  const [immersiveItem, setImmersiveItem] = useState<ExperienceItem | null>(null);
  const showcases: ExperienceItem[] = digitalTwinShowcases.map((item, index) => ({
    ...item,
    ...t.venues.items[index],
  }));

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow={t.venues.eyebrow}
          title={t.venues.title}
          intro={t.venues.intro}
        />

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {showcases.map((item) => (
            <TourCard
              key={item.title}
              item={item}
              action={t.venues.action}
              onOpen={() => setImmersiveItem(item)}
              lockedMessage={isLoggedIn ? undefined : t.venues.locked}
            />
          ))}
        </div>
      </PageShell>

      {immersiveItem && (
        <ImmersiveView item={immersiveItem} onExit={() => setImmersiveItem(null)} />
      )}
    </>
  );
};

export default DigitalTwinsPage;
