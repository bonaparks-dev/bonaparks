import React from 'react';
import { Booking } from '../../types';
import { Page } from '../../App';
import { NightclubIcon, GalleryIcon } from '../IconComponents';

interface BookingsPageProps {
  bookings: Booking[];
  onNavigate: (page: Page) => void;
}

const BookingsPage: React.FC<BookingsPageProps> = ({ bookings, onNavigate }) => {
  return (
    <div className="container mx-auto text-center animate-fade-in px-4 w-full">
      <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
        My Bookings
      </h2>

      {bookings.length > 0 ? (
        <>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-12">
                Here are your exclusive access passes. Present these upon entry.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {bookings.map((booking) => (
                <div 
                    key={booking.id} 
                    className="group bg-black/40 backdrop-blur-md rounded-xl border border-yellow-500/50 shadow-lg shadow-yellow-500/10 overflow-hidden"
                >
                    <div className="relative">
                    <img src={booking.imageUrl} alt={booking.title} className="w-full h-48 object-cover opacity-80" />
                    <div className="absolute top-4 left-4">
                        {booking.type === 'Nightclub' ? <NightclubIcon /> : <GalleryIcon />}
                    </div>
                    </div>
                    <div className="p-6 text-left">
                    <h3 className="text-2xl font-bold text-white mb-2">{booking.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{booking.description}</p>
                     <div className="border-t border-dashed border-gray-600 my-4"></div>
                    <p className="text-sm text-gray-500">Booked on:</p>
                    <p className="text-md text-gray-300 font-mono">{new Date(booking.bookingDate).toLocaleString()}</p>
                    </div>
                </div>
                ))}
            </div>
        </>
      ) : (
        <div className="max-w-xl mx-auto">
            <p className="text-lg text-gray-400 mb-8">
                You have no bookings yet. Explore our venues and galleries to secure your access.
            </p>
            <div className="flex justify-center space-x-4">
                 <button 
                    onClick={() => onNavigate('digital-twins')}
                    className="font-semibold bg-fuchsia-500 text-white px-6 py-3 rounded-md hover:bg-fuchsia-400 transition-colors duration-300 transform hover:scale-105"
                 >
                   Explore Nightclubs
                 </button>
                 <button 
                    onClick={() => onNavigate('proof-of-work')}
                    className="font-semibold bg-sky-500 text-white px-6 py-3 rounded-md hover:bg-sky-400 transition-colors duration-300 transform hover:scale-105"
                 >
                   View Galleries
                 </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;