import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AIIcon, CameraIcon, LoadingIcon, UserIcon, CheckCircleIcon } from '../IconComponents';
import ThreeDScanModal from '../ThreeDScanModal';

// Mock 3D Viewer Component
const Mock3DViewer: React.FC<{ selection: string | null }> = ({ selection }) => (
  <div className="w-full h-full bg-gray-100 dark:bg-black/50 rounded-lg border border-gray-200 dark:border-cyan-500/20 flex items-center justify-center">
    <div className="text-center text-gray-500 dark:text-gray-400">
      {selection ? (
        <div className="animate-fade-in">
            { selection.startsWith('https://') ? (
                <img src={selection} alt="Selected Template" className="w-48 h-48 rounded-full object-cover mx-auto mb-4 border-4 border-cyan-400" />
            ) : (
                 <UserIcon />
            )}
          <p className="font-semibold text-lg text-gray-800 dark:text-white">{selection.startsWith('https://') ? 'Template Selected' : selection}</p>
        </div>
      ) : (
        <>
          <UserIcon />
          <p>3D Avatar Preview</p>
        </>
      )}
    </div>
  </div>
);

// Customization Panel Component
const CustomizationPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Body');
  const tabs = ['Body', 'Head', 'Clothing', 'Accessories'];

  return (
    <div className="bg-white/60 dark:bg-gray-800/50 rounded-lg p-4 h-full flex flex-col backdrop-blur-md border border-gray-200 dark:border-gray-700">
      <div className="flex border-b border-gray-300 dark:border-gray-700 mb-4">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab ? 'text-cyan-500 dark:text-cyan-300 border-b-2 border-cyan-500 dark:border-cyan-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-grow overflow-y-auto space-y-4 pr-2">
        {/* Placeholder content for customization options */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <label className="text-xs text-gray-600 dark:text-gray-400">Parameter {i + 1}</label>
            <input type="range" className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
          </div>
        ))}
      </div>
    </div>
  );
};

const avatarTemplates = [
    { name: 'Nexus', imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Aetheria', imageUrl: 'https://images.pexels.com/photos/7383349/pexels-photo-7383349.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Kaito', imageUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400' }
];

// Main Avatar Studio Page Component
const AvatarStudioPage: React.FC = () => {
    const [scanStatus, setScanStatus] = useState<'idle' | 'complete'>('idle');
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<typeof avatarTemplates[0] | null>(avatarTemplates[0]);
    const [clothingPrompt, setClothingPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedClothingUrl, setGeneratedClothingUrl] = useState<string | null>(null);

    const handleSelectTemplate = (template: typeof avatarTemplates[0]) => {
        setSelectedTemplate(template);
        setScanStatus('idle');
    };

    const handleFaceScan = () => {
        setIsScanModalOpen(true);
    };

    const handleScanComplete = () => {
        setIsScanModalOpen(false);
        setScanStatus('complete');
        setSelectedTemplate(null);
    };
    
    const handleGenerateClothing = useCallback(async () => {
        if (!clothingPrompt.trim()) return;
        setIsGenerating(true);
        setGeneratedClothingUrl(null);
        try {
            // Using a placeholder for demonstration
            await new Promise(resolve => setTimeout(resolve, 2000));
            setGeneratedClothingUrl('https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');
        } catch (error) {
            console.error("Error generating clothing:", error);
        } finally {
            setIsGenerating(false);
        }
    }, [clothingPrompt]);
    
    const getViewerSelection = () => {
        if (scanStatus === 'complete') return 'Biometric Scan Complete';
        if (selectedTemplate) return selectedTemplate.imageUrl;
        return null;
    }

    return (
        <div className="container mx-auto animate-fade-in px-4 w-full">
            <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
                    Avatar Creation Studio
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                    Craft your digital identity. Use our AI-powered tools to create a lifelike avatar for the virtual world.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto h-[65vh]">
                {/* Left Panel: AI Tools */}
                <div className="lg:col-span-1 space-y-6 flex flex-col">
                    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 p-6 flex-grow flex flex-col">
                        <h3 className="text-xl font-bold text-cyan-600 dark:text-cyan-300 mb-4">1. Avatar Foundation</h3>
                        
                        {/* Face Scan */}
                        <div className="space-y-2 mb-4">
                             <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Biometric Scan</label>
                             <button 
                                onClick={handleFaceScan}
                                className={`w-full flex items-center justify-center space-x-3 py-3 rounded-lg font-semibold transition-all duration-300 ${scanStatus === 'complete' ? 'bg-green-500 cursor-default text-white' : 'bg-cyan-500 text-white hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-400'}`}
                             >
                                {scanStatus === 'complete' ? <CheckCircleIcon /> : <CameraIcon />}
                                <span>{scanStatus === 'complete' ? 'Scan Complete' : 'Initiate 3D Face Scan'}</span>
                             </button>
                        </div>
                        
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                            <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-xs uppercase">OR</span>
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        </div>

                        {/* Template Selection */}
                        <div className="space-y-2 mt-2">
                             <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">Choose a Base Model</label>
                             <div className="grid grid-cols-3 gap-2">
                                {avatarTemplates.map(template => (
                                    <button key={template.name} onClick={() => handleSelectTemplate(template)} className={`relative rounded-lg overflow-hidden border-2 transition-all duration-300 ${selectedTemplate?.name === template.name ? 'border-cyan-400 ring-2 ring-cyan-400' : 'border-transparent hover:border-cyan-500/50'}`}>
                                        <img src={template.imageUrl} alt={template.name} className="w-full h-24 object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        <p className="absolute bottom-1 left-2 text-white text-xs font-semibold">{template.name}</p>
                                    </button>
                                ))}
                             </div>
                        </div>


                        {/* Generative Clothing */}
                        <div className="space-y-3 mt-auto pt-6 border-t border-gray-300 dark:border-gray-700/50">
                            <h3 className="text-xl font-bold text-fuchsia-600 dark:text-fuchsia-300">2. Generative Clothing</h3>
                            <textarea
                                id="clothing-prompt"
                                rows={2}
                                value={clothingPrompt}
                                onChange={(e) => setClothingPrompt(e.target.value)}
                                placeholder="e.g., 'a futuristic cyberpunk jacket with neon trim'"
                                className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                            />
                            <button
                                onClick={handleGenerateClothing}
                                disabled={isGenerating || !clothingPrompt}
                                className="w-full flex items-center justify-center space-x-3 py-3 rounded-lg font-semibold bg-fuchsia-500 text-white hover:bg-fuchsia-400 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <LoadingIcon /> : <AIIcon className="h-5 w-5" />}
                                <span>{isGenerating ? 'Generating...' : 'Generate Texture'}</span>
                            </button>
                            {generatedClothingUrl && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Generated Texture:</p>
                                    <img src={generatedClothingUrl} alt="Generated clothing texture" className="w-full h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center Panel: 3D Viewer */}
                <div className="lg:col-span-1">
                    <Mock3DViewer selection={getViewerSelection()} />
                </div>

                {/* Right Panel: Customization */}
                <div className="lg:col-span-1">
                    <CustomizationPanel />
                </div>
            </div>
            {isScanModalOpen && (
                <ThreeDScanModal
                    onClose={() => setIsScanModalOpen(false)}
                    onComplete={handleScanComplete}
                />
            )}
        </div>
    );
};

export default AvatarStudioPage;