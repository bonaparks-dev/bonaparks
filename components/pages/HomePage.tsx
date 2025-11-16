import React from 'react';
import { AIIcon, DigitalTwinIcon, GalleryIcon, ControlRoomIcon, AISolutionIcon, UserPlusIcon } from '../IconComponents';
import { Page } from '../../App';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  isLoggedIn: boolean;
}

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onClick?: () => void;
  disabled?: boolean;
  theme?: 'primary' | 'secondary' | 'accent' | 'tertiary';
}> = ({ icon, title, description, buttonText, onClick, disabled, theme = 'secondary' }) => {
  const themes = {
    primary: {
      border: 'border-cyan-500/30 shadow-cyan-500/10 hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-400/30',
      button: 'bg-cyan-500 text-white hover:bg-cyan-400 focus:ring-cyan-400',
    },
    secondary: {
      border: 'border-fuchsia-500/20 shadow-fuchsia-500/5 hover:border-fuchsia-400 hover:shadow-2xl hover:shadow-fuchsia-400/15',
      button: 'bg-fuchsia-500 text-white hover:bg-fuchsia-400 focus:ring-fuchsia-400',
    },
    tertiary: {
      border: 'border-lime-500/20 shadow-lime-500/5 hover:border-lime-400 hover:shadow-2xl hover:shadow-lime-400/15',
      button: 'bg-lime-500 text-black hover:bg-lime-400 focus:ring-lime-400',
    },
    accent: {
        border: 'border-yellow-500/20 shadow-yellow-500/5 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-400/15',
        button: 'bg-yellow-500 text-black hover:bg-yellow-400 focus:ring-yellow-400',
      }
  };
  
  const selectedTheme = themes[theme];
  const disabledButton = 'bg-gray-400 dark:bg-gray-700/80 cursor-not-allowed';

  return (
    <div className={`flex flex-col bg-white/60 dark:bg-black/40 backdrop-blur-md p-8 rounded-xl border shadow-lg transition-all duration-300 hover:scale-105 ${selectedTheme.border}`}>
      <div className="mx-auto mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center flex-grow">{description}</p>
      <button 
        onClick={onClick} 
        disabled={disabled}
        className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 ${disabled ? disabledButton : selectedTheme.button}`}
      >
        {buttonText}
      </button>
    </div>
  );
};

const HomePage: React.FC<HomePageProps> = ({ onNavigate, isLoggedIn }) => {
  return (
    <div className="container mx-auto text-center animate-fade-in px-4">
      <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
        Step Into Another Reality
      </h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
        Explore a universe of immersive digital experiences, from exclusive virtual nightclubs to mind-bending art galleries.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <FeatureCard
          icon={<AIIcon className="h-8 w-8 text-cyan-300"/>}
          title="AI Business Assistant"
          description="Engage 'Bonus,' our B2B AI, for automation strategies, creative content generation, and marketing solutions."
          buttonText="Engage Bonus"
          onClick={() => onNavigate('ai-assistant')}
          theme="primary"
        />
        <FeatureCard
          icon={<DigitalTwinIcon />}
          title="Immersive Venues"
          description="Explore high-fidelity digital replicas of real-world venues. We have nightclubs, museums, social lounges, and more."
          buttonText="Explore Venues"
          onClick={() => onNavigate('digital-twins')}
          theme="secondary"
        />
        <FeatureCard
          icon={<UserPlusIcon className="h-8 w-8 text-cyan-300" />}
          title="Avatar Studio"
          description="Craft your unique digital identity with our AI-powered creator. Scan your face and generate custom clothing."
          buttonText="Create Your Avatar"
          onClick={() => onNavigate('avatar-studio')}
          theme="primary"
        />
        <FeatureCard
          icon={<AISolutionIcon />}
          title="AI-Powered Fun"
          description="Learn about the technology that powers our interactive NPCs, dynamic events, and personalized experiences."
          buttonText="See The Tech"
          onClick={() => onNavigate('ai-solutions')}
          theme="tertiary"
        />
        <FeatureCard
          icon={<GalleryIcon />}
          title="Experience Gallery"
          description="An interactive showcase of past events and collaborations. See the highlights and get inspired for your next visit."
          buttonText="Enter Gallery"
          onClick={() => onNavigate('proof-of-work')}
          theme="secondary"
        />
      </div>
      {isLoggedIn && (
          <div className="max-w-xl mx-auto mt-12">
             <FeatureCard
                icon={<ControlRoomIcon />}
                title="My Bookings"
                description="Access your dashboard to view active tickets, event passes, and exclusive digital collectibles."
                buttonText="View My Bookings"
                onClick={() => onNavigate('control-room')}
                theme="accent"
                />
          </div>
        )}
    </div>
  );
};

export default HomePage;