import React, { useState } from 'react';
import ImmersiveView from '../ImmersiveView';
import TourCard from '../TourCard';
import { ExperienceItem } from '../../types';
import { PageHeader, PageShell } from '../ui';

const digitalTwinShowcases: ExperienceItem[] = [
  {
    title: 'The Onyx Lounge',
    category: 'Nightclub',
    description: 'A multi-level virtual space scanned with millimeter accuracy, hosting weekly DJ sets and social events.',
    imageUrl: 'https://images.pexels.com/photos/2114365/pexels-photo-2114365.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    title: 'Starlight Social Club',
    category: 'Lounge',
    description: 'A retro-futuristic hub for meeting friends, featuring interactive games and personalized ambient music.',
    imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
  {
    title: 'Bloom Museum Wing',
    category: 'Museum',
    description: 'An ethereal, nature-infused gallery where digital exhibits come to life, providing an unforgettable educational journey.',
    imageUrl: 'https://images.pexels.com/photos/932638/pexels-photo-932638.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  },
];

interface DigitalTwinsPageProps {
  isLoggedIn: boolean;
}

const DigitalTwinsPage: React.FC<DigitalTwinsPageProps> = ({ isLoggedIn }) => {
  const [immersiveItem, setImmersiveItem] = useState<ExperienceItem | null>(null);

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow="Immersive venues"
          title="Places built to be visited, not just looked at"
          intro="High-fidelity interactive replicas of real and imagined spaces. Step inside and explore at your own pace."
        />

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {digitalTwinShowcases.map((item) => (
            <TourCard
              key={item.title}
              item={item}
              action="Explore in VR/AR"
              onOpen={() => setImmersiveItem(item)}
              lockedMessage={isLoggedIn ? undefined : 'Log in to explore'}
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
