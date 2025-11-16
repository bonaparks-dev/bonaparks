import React, { useState } from 'react';
import ImmersiveView from '../ImmersiveView';
import { ExperienceItem } from '../../types';

const proofOfWorkItems: ExperienceItem[] = [
  {
    title: 'Portofino Penthouse',
    category: 'Luxury Real Estate',
    description: 'An exquisite penthouse showcasing premium architectural design and panoramic views, captured in stunning 3D detail.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/WFbpmYeHDm6/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=WFbpmYeHDm6',
    metrics: [{label: 'Space Type', value: 'Penthouse'}, {label: 'Tour Quality', value: '4K HD'}]
  },
  {
    title: 'Baroom',
    category: 'Commercial Space',
    description: 'A sophisticated bar and lounge space featuring modern design elements and immersive atmosphere.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/FAaxa1f7Z8A/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=FAaxa1f7Z8A',
    metrics: [{label: 'Space Type', value: 'Bar/Lounge'}, {label: 'Tour Quality', value: '4K HD'}]
  },
  {
    title: '728 Miami',
    category: 'Nightclub',
    description: 'A vibrant nightclub venue in the heart of Miami, featuring cutting-edge design and electrifying entertainment spaces.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/R6kNQefu9nQ/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=R6kNQefu9nQ',
    metrics: [{label: 'Location', value: 'Miami'}, {label: 'Tour Quality', value: '4K HD'}]
  },
  {
    title: 'Mr Jones',
    category: 'Nightclub',
    description: 'An upscale nightclub experience with premium interior design and world-class entertainment facilities.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/dSJ6ko28ARr/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=dSJ6ko28ARr',
    metrics: [{label: 'Space Type', value: 'Nightclub'}, {label: 'Tour Quality', value: '4K HD'}]
  },
  {
    title: 'Selargius Residence',
    category: 'Residential',
    description: 'A beautifully designed residential property showcasing elegant living spaces and thoughtful architectural details.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/3hBsCXGyTmX/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=3hBsCXGyTmX',
    metrics: [{label: 'Space Type', value: 'House'}, {label: 'Tour Quality', value: '4K HD'}]
  },
  {
    title: 'Palestra Max',
    category: 'Sports & Fitness',
    description: 'A state-of-the-art boxing gym equipped with professional training facilities and modern workout spaces.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/6o9yCk49EjN/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=6o9yCk49EjN',
    metrics: [{label: 'Space Type', value: 'Boxing Gym'}, {label: 'Tour Quality', value: '4K HD'}]
  },
];

interface ProofOfWorkPageProps {
  isLoggedIn: boolean;
}

const ProofOfWorkPage: React.FC<ProofOfWorkPageProps> = ({ isLoggedIn }) => {
  const [immersiveItem, setImmersiveItem] = useState<ExperienceItem | null>(null);

  return (
    <div className="container mx-auto text-center animate-fade-in px-4 w-full">
      <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
        Experience Gallery
      </h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-12">
        A look back at our greatest hits. Explore interactive showcases of past events and collaborations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {proofOfWorkItems.map((item) => (
           <div 
            key={item.title} 
            className="flex flex-col group bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg overflow-hidden transition-all duration-300 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/10 transform hover:-translate-y-2"
          >
            <div className="relative">
              <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">{item.category}</div>
            </div>
            <div className="p-6 text-left flex flex-col flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 flex-grow mb-4">{item.description}</p>
              
              <div className="border-t border-dashed border-gray-300 dark:border-gray-700 my-4"></div>
              
              <div className="space-y-2 mb-6">
                {item.metrics?.map(metric => (
                    <div key={metric.label} className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</span>
                        <span className="text-lg font-bold text-lime-600 dark:text-lime-300 font-mono">{metric.value}</span>
                    </div>
                ))}
              </div>

              <div className="flex justify-end items-center mt-auto">
                 <button
                    onClick={() => setImmersiveItem(item)}
                    disabled={!isLoggedIn}
                    className="font-semibold bg-sky-500 text-white px-6 py-2.5 rounded-md hover:bg-sky-400 transition-colors duration-300 transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                    aria-label={`Launch Demo for ${item.title}`}
                  >
                    View Highlight Reel
                  </button>
              </div>
               {!isLoggedIn && <p className="text-xs text-gray-500 text-right mt-2">You must be logged in to view highlights.</p>}
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

export default ProofOfWorkPage;