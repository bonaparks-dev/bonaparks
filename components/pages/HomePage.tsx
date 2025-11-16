import React, { useState } from 'react';
import { ExperienceItem } from '../../types';
import ImmersiveView from '../ImmersiveView';

interface HomePageProps {
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
}

const portfolioItems: ExperienceItem[] = [
  {
    title: 'Portofino Penthouse',
    category: 'Luxury Real Estate',
    description: 'An exquisite penthouse showcasing premium architectural design and panoramic views, captured in stunning 3D detail.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/WFbpmYeHDm6/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=WFbpmYeHDm6',
  },
  {
    title: 'Baroom',
    category: 'Commercial Space',
    description: 'A sophisticated bar and lounge space featuring modern design elements and immersive atmosphere.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/FAaxa1f7Z8A/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=FAaxa1f7Z8A',
  },
  {
    title: '728 Miami',
    category: 'Nightclub',
    description: 'A vibrant nightclub venue in the heart of Miami, featuring cutting-edge design and electrifying entertainment spaces.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/R6kNQefu9nQ/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=R6kNQefu9nQ',
  },
  {
    title: 'Mr Jones',
    category: 'Nightclub',
    description: 'An upscale nightclub experience with premium interior design and world-class entertainment facilities.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/dSJ6ko28ARr/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=dSJ6ko28ARr',
  },
  {
    title: 'Selargius Residence',
    category: 'Residential',
    description: 'A beautifully designed residential property showcasing elegant living spaces and thoughtful architectural details.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/3hBsCXGyTmX/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=3hBsCXGyTmX',
  },
  {
    title: 'Palestra Max',
    category: 'Sports & Fitness',
    description: 'A state-of-the-art boxing gym equipped with professional training facilities and modern workout spaces.',
    imageUrl: 'https://my.matterport.com/api/v1/player/models/6o9yCk49EjN/thumb',
    matterportUrl: 'https://my.matterport.com/show/?m=6o9yCk49EjN',
  },
];

const HomePage: React.FC<HomePageProps> = ({ onNavigate, isLoggedIn }) => {
  const [selectedItem, setSelectedItem] = useState<ExperienceItem | null>(null);

  return (
    <div className="container mx-auto animate-fade-in px-4 w-full">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-800 dark:text-slate-100 mb-6 tracking-tight">
          3D Virtual Tours
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Professional Matterport scanning and 3D visualization services for real estate, commercial spaces, and venues
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500 dark:text-slate-500">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            High-Resolution 4K
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Professional Quality
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            Interactive 3D
          </span>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {portfolioItems.map((item) => (
          <div
            key={item.title}
            className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-400/20 dark:hover:shadow-slate-950/40 hover:-translate-y-1"
          >
            <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-900">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
                }}
              />
              <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-slate-700">
                {item.category}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                {item.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {item.description}
              </p>

              <button
                onClick={() => setSelectedItem(item)}
                className="w-full bg-slate-800 dark:bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-amber-600 dark:hover:bg-amber-600 transition-all duration-300 transform hover:scale-[1.02] shadow-sm hover:shadow-md"
              >
                View 3D Tour
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="mt-20 text-center pb-8">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Need 3D Scanning Services?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Professional Matterport scanning for your property or venue
          </p>
          <a
            href="mailto:contact@bonaparks.com"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl"
          >
            Get in Touch
          </a>
        </div>
      </div>

      {selectedItem && (
        <ImmersiveView
          item={selectedItem}
          onExit={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default HomePage;