import React from 'react';
import { Booking } from '../../types';
import { Page } from '../../App';
import { DigitalTwinIcon, GalleryIcon } from '../IconComponents';

interface ControlRoomPageProps {
  bookings: Booking[];
  onNavigate: (page: Page) => void;
}

const ControlRoomPage: React.FC<ControlRoomPageProps> = ({ bookings, onNavigate }) => {
  const getProjectIcon = (title: string) => {
    if (title.toLowerCase().includes('lounge') || title.toLowerCase().includes('disco')) return <DigitalTwinIcon />;
    if (title.toLowerCase().includes('gallery') || title.toLowerCase().includes('exhibit')) return <GalleryIcon />;
    return <DigitalTwinIcon />;
  }

  const getStatusColor = (status: Booking['status']) => {
    switch(status) {
        case 'Active': return 'text-green-700 dark:text-green-400 border-green-500/50 bg-green-100 dark:bg-green-500/10';
        case 'Redeemed': return 'text-cyan-700 dark:text-cyan-400 border-cyan-500/50 bg-cyan-100 dark:bg-cyan-500/10';
        case 'Pending': return 'text-yellow-700 dark:text-yellow-400 border-yellow-500/50 bg-yellow-100 dark:bg-yellow-500/10';
    }
  }

  return (
    <div className="container mx-auto text-center animate-fade-in px-4 w-full">
      <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
        My Bookings
      </h2>

      {bookings.length > 0 ? (
        <>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-12">
                Holographic overview of your access passes and tickets for Bona Parks experiences.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {bookings.map((booking) => (
                <div 
                    key={booking.id} 
                    className="group bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg overflow-hidden transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10"
                >
                    <div className="p-6 text-left">
                        <div className="flex justify-between items-start">
                             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex-1 pr-4">{booking.title}</h3>
                             <div className="flex-shrink-0">{getProjectIcon(booking.title)}</div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 h-12">{booking.description}</p>
                        
                        <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-4"></div>

                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500">Acquired:</p>
                                <p className="text-md text-gray-700 dark:text-gray-300 font-mono">{new Date(booking.lastUpdate).toLocaleDateString()}</p>
                            </div>
                             <span className={`px-3 py-1 text-sm font-bold rounded-full border ${getStatusColor(booking.status)}`}>{booking.status}</span>
                        </div>
                        <button className="w-full mt-6 py-2.5 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700/80 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                            View Access Pass
                        </button>
                    </div>
                </div>
                ))}
            </div>
        </>
      ) : (
        <div className="max-w-xl mx-auto">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                You have no bookings yet. Explore our venues to get started.
            </p>
            <div className="flex justify-center">
                 <button 
                    onClick={() => onNavigate('home')}
                    className="font-semibold bg-cyan-500 text-white px-6 py-3 rounded-md hover:bg-cyan-400 transition-colors duration-300 transform hover:scale-105"
                 >
                   Explore Experiences
                 </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ControlRoomPage;