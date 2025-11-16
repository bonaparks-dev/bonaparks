import React, { useState, useEffect } from 'react';
import { BookableItem } from '../types';
import { LoadingIcon, CheckCircleIcon } from './IconComponents';

interface BookingModalProps {
  item: BookableItem;
  onClose: () => void;
  onConfirm: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ item, onClose, onConfirm }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirmClick = () => {
    setIsProcessing(true);
    // Simulate network delay for transaction
    setTimeout(() => {
      onConfirm();
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2500);
  };

  // Close modal automatically after success message
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-800 dark:text-white bg-white/50 dark:bg-black/50 rounded-full p-1 hover:bg-white/80 dark:hover:bg-black/80 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8 text-center">
            {isSuccess ? (
                <div className="flex flex-col items-center justify-center h-48 animate-fade-in">
                    <CheckCircleIcon />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Booking Confirmed!</h3>
                    <p className="text-gray-600 dark:text-gray-400">Your ticket has been added to 'My Bookings'.</p>
                </div>
            ) : isProcessing ? (
                <div className="flex flex-col items-center justify-center h-48">
                    <LoadingIcon />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Processing Transaction...</h3>
                    <p className="text-gray-600 dark:text-gray-400">Please confirm in your wallet and wait a moment.</p>
                </div>
            ) : (
                <>
                    <h2 id="booking-modal-title" className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">You are about to purchase entry for this experience.</p>
                    <div className="bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-8">
                        <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 font-semibold">PRICE</span>
                        <span className="text-2xl font-bold text-cyan-500 dark:text-cyan-300">{item.price} ETH</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleConfirmClick}
                        className="w-full py-3 rounded-lg font-semibold bg-cyan-500 text-white hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-cyan-400 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                        Confirm Purchase
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;