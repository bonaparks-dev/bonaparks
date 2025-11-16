import React from 'react';
import { Page } from '../../App';
import { AIIcon } from '../IconComponents';

const SolutionCard: React.FC<{ title: string; description: string; }> = ({ title, description }) => (
    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md p-8 rounded-xl border border-lime-500/20 shadow-lg shadow-lime-500/5 transition-all duration-300 hover:border-lime-400/50 hover:shadow-xl hover:shadow-lime-400/10">
        <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-300 mb-3">{title}</h3>
        <p className="text-gray-700 dark:text-gray-300">{description}</p>
    </div>
);

const AISolutionsPage: React.FC<{ onNavigate: (page: Page) => void; }> = ({ onNavigate }) => {
    return (
        <div className="container mx-auto text-center animate-fade-in px-4 w-full">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
                The Tech Behind The Magic
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
                We use cutting-edge artificial intelligence to make our virtual worlds more immersive, interactive, and unforgettable.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
                <SolutionCard 
                    title="Dynamic NPCs"
                    description="Our characters and guides are powered by advanced AI, allowing for natural conversations and unique interactions."
                />
                <SolutionCard 
                    title="Personalized Experiences"
                    description="Our platform learns your preferences to recommend events, venues, and art that you'll love."
                />
                <SolutionCard 
                    title="Interactive Worlds"
                    description="From AI-generated art to responsive environments, our tech creates a living world that reacts to you."
                />
            </div>
            <div className="flex flex-col items-center space-y-4 mb-12">
                <p className="text-gray-700 dark:text-gray-300">Curious to learn more?</p>
                <button 
                    onClick={() => onNavigate('ai-assistant')}
                    className="flex items-center space-x-3 font-semibold bg-cyan-500 text-white px-8 py-3 rounded-md hover:bg-cyan-400 transition-colors duration-300 transform hover:scale-105"
                 >
                   <AIIcon className="h-6 w-6" />
                   <span>Ask Bonus</span>
                 </button>
            </div>
        </div>
    );
};

export default AISolutionsPage;