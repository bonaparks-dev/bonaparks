import React, { useState } from 'react';
import BookingModal from './BookingModal';
import ImmersiveView from './ImmersiveView';
import { BookableItem } from '../types';
import { VRIcon } from './IconComponents';

const upcomingExhibitions: BookableItem[] = [
  {
    title: 'Echoes of Tomorrow',
    description: 'A journey through speculative futures, exploring the intersection of AI and human creativity.',
    imageUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    price: 0.02
  },
  {
    title: 'Digital Dreams',
    description: 'An immersive exhibition showcasing the vibrant, surreal landscapes of generative art from pioneers.',
    imageUrl: 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    price: 0.025
  },
  {
    title: 'Kinetic Forms',
    description: 'Experience sculptures that live and breathe. Dynamic, interactive installations that respond to you.',
    imageUrl: 'https://images.pexels.com/photos/1578332/pexels-photo-1578332.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    price: 0.03
  },
];

interface GalleryPageProps {
  isLoggedIn: boolean;
  onBook: (item: BookableItem, type: 'Nightclub' | 'Exhibition') => void;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ isLoggedIn, onBook }) => {
  const [selectedItem, setSelectedItem] = useState<BookableItem | null>(null);
  const [immersiveItem, setImmersiveItem] = useState<BookableItem | null>(null);

  const handleConfirmBooking = () => {
    if (selectedItem) {
      onBook(selectedItem, 'Exhibition');
    }
  };

  return (
    <div className="container mx-auto text-center animate-fade-in px-4 w-full">
      <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
        Art Galleries
      </h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-12">
        Acquire access to our meticulously curated exhibitions. A glimpse of the exceptional awaits.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {upcomingExhibitions.map((exhibit) => (
           <div 
            key={exhibit.title} 
            className="flex flex-col group bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg overflow-hidden transition-all duration-300 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/10 transform hover:-translate-y-2"
          >
            <div className="relative">
              <img src={exhibit.imageUrl} alt={exhibit.title} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="p-6 text-left flex flex-col flex-grow">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{exhibit.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 flex-grow mb-6">{exhibit.description}</p>
              <div className="flex justify-between items-center mt-auto">
                 <p className="text-xl font-bold text-cyan-500 dark:text-cyan-300">{exhibit.price} ETH</p>
                 <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setImmersiveItem(exhibit)}
                      disabled={!isLoggedIn}
                      className="font-semibold text-cyan-600 dark:text-cyan-300 border border-cyan-500/50 px-4 py-2.5 rounded-md hover:bg-cyan-500/20 hover:border-cyan-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Enter VR/AR Experience for ${exhibit.title}`}
                    >
                        Enter VR/AR Experience
                    </button>
                    <button
                      onClick={() => setSelectedItem(exhibit)}
                      disabled={!isLoggedIn}
                      className="font-semibold bg-sky-500 text-white px-6 py-2.5 rounded-md hover:bg-sky-400 transition-colors duration-300 transform hover:scale-105 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                      aria-label={`Book now for ${exhibit.title}`}
                    >
                      Book Now
                    </button>
                  </div>
              </div>
               {!isLoggedIn && <p className="text-xs text-gray-500 text-right mt-2">You must be logged in to book.</p>}
            </div>
          </div>
        ))}
      </div>
       {selectedItem && (
        <BookingModal 
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleConfirmBooking}
        />
      )}
      {immersiveItem && (
        <ImmersiveView 
            item={immersiveItem}
            onExit={() => setImmersiveItem(null)}
        />
      )}
    </div>
  );
};

export default GalleryPage;