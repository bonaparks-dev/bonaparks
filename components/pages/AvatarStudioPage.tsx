import React, { useState, useCallback } from 'react';
import { AIIcon, CameraIcon, LoadingIcon, UserIcon, CheckCircleIcon } from '../IconComponents';
import ThreeDScanModal from '../ThreeDScanModal';
import { Button, PageHeader, PageShell, Panel } from '../ui';

// Mock 3D Viewer Component
const Mock3DViewer: React.FC<{ selection: string | null }> = ({ selection }) => (
  <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-line bg-surface">
    <div className="text-center text-muted">
      {selection ? (
        <div className="animate-fade-in">
          {selection.startsWith('https://') ? (
            <img
              src={selection}
              alt="Selected template"
              className="mx-auto mb-5 h-40 w-40 rounded-full border border-accent object-cover"
            />
          ) : (
            <div className="flex justify-center">
              <UserIcon />
            </div>
          )}
          <p className="mt-3 font-display text-2xl text-bone">
            {selection.startsWith('https://') ? 'Template selected' : selection}
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <UserIcon />
          </div>
          <p className="mt-3 text-xs uppercase tracking-widest2">3D avatar preview</p>
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
    <Panel className="flex h-full flex-col p-6">
      <div className="flex border-b border-line">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-widest2 transition-colors ${
              activeTab === tab
                ? 'border-b border-accent text-accent'
                : 'text-muted hover:text-bone'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-6 flex-grow space-y-5 overflow-y-auto pr-1">
        {/* Placeholder content for customization options */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest2 text-muted">
              Parameter {i + 1}
            </label>
            <input
              type="range"
              aria-label={`Parameter ${i + 1}`}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-line accent-accent"
            />
          </div>
        ))}
      </div>
    </Panel>
  );
};

const avatarTemplates = [
  { name: 'Nexus', imageUrl: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { name: 'Aetheria', imageUrl: 'https://images.pexels.com/photos/7383349/pexels-photo-7383349.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { name: 'Kaito', imageUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400' },
];

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
    if (scanStatus === 'complete') return 'Biometric scan complete';
    if (selectedTemplate) return selectedTemplate.imageUrl;
    return null;
  };

  return (
    <>
      <PageShell>
        <PageHeader
          eyebrow="Avatar Studio"
          title="Craft your digital identity"
          intro="Use our AI-powered tools to create a lifelike avatar for the virtual world."
        />

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: foundation + generative clothing */}
          <Panel className="flex flex-col p-6 md:p-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest2 text-accent">
              1 &middot; Avatar foundation
            </h2>

            <div className="mt-5">
              <label className="text-xs uppercase tracking-widest2 text-muted">Biometric scan</label>
              <button
                onClick={() => setIsScanModalOpen(true)}
                className={`mt-3 flex w-full items-center justify-center gap-3 rounded-full py-3 text-sm font-semibold transition-colors duration-300 ${
                  scanStatus === 'complete'
                    ? 'cursor-default bg-accent text-on-accent'
                    : 'border border-line text-bone hover:border-accent hover:text-accent'
                }`}
              >
                {scanStatus === 'complete' ? <CheckCircleIcon /> : <CameraIcon />}
                <span>{scanStatus === 'complete' ? 'Scan complete' : 'Start 3D face scan'}</span>
              </button>
            </div>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-grow bg-line" />
              <span className="text-[10px] uppercase tracking-widest2 text-muted">Or</span>
              <span className="h-px flex-grow bg-line" />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest2 text-muted">Choose a base model</label>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {avatarTemplates.map(template => (
                  <button
                    key={template.name}
                    onClick={() => handleSelectTemplate(template)}
                    className={`relative overflow-hidden rounded-lg border transition-colors duration-300 ${
                      selectedTemplate?.name === template.name
                        ? 'border-accent'
                        : 'border-line hover:border-accent/50'
                    }`}
                  >
                    <img src={template.imageUrl} alt={template.name} className="h-24 w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />
                    <p className="absolute bottom-1.5 left-2 text-[10px] font-semibold uppercase tracking-widest2 text-bone">
                      {template.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-3 border-t border-line pt-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest2 text-accent">
                2 &middot; Generative clothing
              </h2>
              <textarea
                id="clothing-prompt"
                rows={2}
                value={clothingPrompt}
                onChange={(e) => setClothingPrompt(e.target.value)}
                placeholder="e.g. a futuristic cyberpunk jacket with neon trim"
                className="w-full rounded-lg border border-line bg-ink px-4 py-3 text-sm text-bone placeholder-muted/60 transition-colors duration-300 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <Button
                onClick={handleGenerateClothing}
                disabled={isGenerating || !clothingPrompt}
                className="w-full"
              >
                {isGenerating ? <LoadingIcon /> : <AIIcon className="h-4 w-4" />}
                <span>{isGenerating ? 'Generating...' : 'Generate texture'}</span>
              </Button>
              {generatedClothingUrl && (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-widest2 text-muted">Generated texture</p>
                  <img
                    src={generatedClothingUrl}
                    alt="Generated clothing texture"
                    className="h-20 w-full rounded-lg border border-line object-cover"
                  />
                </div>
              )}
            </div>
          </Panel>

          {/* Center: viewer */}
          <Mock3DViewer selection={getViewerSelection()} />

          {/* Right: customization */}
          <CustomizationPanel />
        </div>
      </PageShell>

      {isScanModalOpen && (
        <ThreeDScanModal
          onClose={() => setIsScanModalOpen(false)}
          onComplete={handleScanComplete}
        />
      )}
    </>
  );
};

export default AvatarStudioPage;
