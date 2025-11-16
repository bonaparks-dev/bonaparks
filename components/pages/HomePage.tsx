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
      <section className="hero-section text-center mb-20">
        <div className="hero-text">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-800 dark:text-slate-100 mb-8 tracking-tight leading-tight">
            Discover Sardinia Like Never Before
          </h1>
          <p className="text-2xl md:text-3xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed font-light mb-4">
            Immersive digital experiences that bring spaces to life
          </p>
          <p className="text-lg text-slate-500 dark:text-slate-500 max-w-3xl mx-auto leading-relaxed">
            From luxury penthouses to vibrant nightclubs, explore extraordinary venues through cutting-edge 3D technology
          </p>
        </div>
      </section>

      {/* Our World Section */}
      <section id="our-world" className="mb-20 max-w-4xl mx-auto">
        <div className="language-en">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">
            Our World
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Bona Parks was born from a vision: To fuse the heritage of the past with the innovation of the future.
            We believe that spaces tell stories, and through immersive digital experiences, we preserve and share
            these narratives with the world.
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Using professional Matterport scanning and 3D visualization technology, we transform real-world venues
            into interactive digital experiences. Each space we capture becomes a window into possibility, whether
            for real estate, hospitality, cultural preservation, or entertainment.
          </p>
        </div>
      </section>

      {/* Featured Experiences */}
      <section id="experiences" className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">
          Featured Experiences
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 text-center mb-12 max-w-2xl mx-auto">
          Step inside our collection of meticulously captured spaces
        </p>
      </section>

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
      <section className="cta-section mt-20 text-center pb-8">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
            Transform Your Space Into an Experience
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Whether you are showcasing real estate, promoting a venue, or preserving cultural heritage,
            we bring your vision to life through immersive 3D technology.
          </p>
          <a
            href="mailto:contact@bonaparks.com"
            className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold px-10 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl text-lg"
          >
            Start Your Project
          </a>
        </div>
      </section>

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
