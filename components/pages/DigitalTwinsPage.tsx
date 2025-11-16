import React, { useState } from 'react';
import ImmersiveView from '../ImmersiveView';
import { ExperienceItem } from '../../types';
import { VRIcon } from '../IconComponents';

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
    <div className="container mx-auto text-center animate-fade-in px-4 w-full">
      <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
        Immersive Venues
      </h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-12">
        High-fidelity, interactive replicas of real and imagined spaces. Step inside our creations and explore.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {digitalTwinShowcases.map((item) => (
          <div 
            key={item.title} 
            className="flex flex-col group bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg overflow-hidden transition-all duration-300 hover:border-fuchsia-500/50 hover:shadow-2xl hover:shadow-fuchsia-500/10 transform hover:-translate-y-2"
          >
            <div className="relative">
              <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" />
               <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">{item.category}</div>
            </div>
            <div className="p-6 text-left flex flex-col flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 flex-grow mb-6">{item.description}</p>
              <div className="flex justify-end items-center mt-auto">
                <button 
                    onClick={() => setImmersiveItem(item)}
                    disabled={!isLoggedIn}
                    className="flex items-center space-x-2 font-semibold text-cyan-600 dark:text-cyan-300 border border-cyan-500/50 px-5 py-2.5 rounded-md hover:bg-cyan-500/20 hover:border-cyan-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Explore VR/AR Experience for ${item.title}`}
                >
                    <VRIcon />
                    <span>Explore in VR/AR</span>
                </button>
              </div>
              {!isLoggedIn && <p className="text-xs text-gray-500 text-right mt-2">You must be logged in to explore.</p>}
            </div>
          </div>
        ))}
      </div>
      {immersiveItem && (
        <ImmersiveView 
            item={immersiveItem}
            onExit={() => setImmersiveItem(null)}
        />
      )}
    </div>
  );
};

export default DigitalTwinsPage;