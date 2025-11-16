import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Page } from '../../App';
import { BriefcaseIcon, LoadingIcon, AIIcon } from '../IconComponents';
import { generateImage, editImage, generateVideo, checkVideoStatus, editVideo } from '../../services/geminiService';
import type { AspectRatio } from '../../services/geminiService';

const videoStatusMessages = [
    'Contacting the creative AI...',
    'Warming up the rendering engines...',
    'Assembling digital assets...',
    'This can take a few minutes, please wait...',
    'Adding final cinematic touches...',
    'Almost there, the AI is very proud of this one...'
];

const assetTypes = {
    social: { name: 'Social Media Post', ratios: { '1:1': 'Square Post (1:1)', '3:4': 'Portrait Post (4:5 Approx.)', '9:16': 'Story / Reel (9:16)' } },
    banner: { name: 'Ad Banner', ratios: { '16:9': 'Leaderboard (Approx.)', '9:16': 'Skyscraper (Approx.)', '4:3': 'Rectangle (Approx.)' } },
    flyer: { name: 'Promotional Flyer', ratios: { '3:4': 'A4/Letter Portrait (Approx.)' } },
    general: { name: 'General Purpose', ratios: { '1:1': 'Square (1:1)', '16:9': 'Widescreen (16:9)', '9:16': 'Tall (9:16)', '4:3': 'Standard (4:3)', '3:4': 'Portrait (3:4)' } }
};

type AssetType = keyof typeof assetTypes;

const BusinessStudioPage: React.FC<{ onNavigate: (page: Page) => void }> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
    const [logo, setLogo] = useState<string | null>(null);

    // Image State
    const [assetType, setAssetType] = useState<AssetType>('social');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imagePrompt, setImagePrompt] = useState<string>('A vibrant, abstract representation of data flowing through a network, with glowing lines and nodes.');
    const [overlayText, setOverlayText] = useState<string>('The Future is Now');
    const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
    const [imageResult, setImageResult] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

    // Video State
    const [videoPrompt, setVideoPrompt] = useState<string>('An aerial drone shot of a futuristic city at sunset, with flying cars');
    const [videoAspectRatio, setVideoAspectRatio] = useState<AspectRatio>('16:9');
    const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
    const [videoResult, setVideoResult] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [videoStatusMessage, setVideoStatusMessage] = useState<string>('');
    const videoPollInterval = useRef<NodeJS.Timeout | null>(null);

    // Video Editing State
    const [editPrompt, setEditPrompt] = useState<string>('Make the colors more vibrant.');
    const [isEditingVideo, setIsEditingVideo] = useState<boolean>(false);
    const [editVideoError, setEditVideoError] = useState<string | null>(null);
    const [selectedMusicTrack, setSelectedMusicTrack] = useState<string>('epic_orchestral');
    const [editRegion, setEditRegion] = useState<string>('entire');


    useEffect(() => {
        const savedLogo = localStorage.getItem('user-logo');
        if (savedLogo) {
            setLogo(savedLogo);
        }
        return () => {
            if (videoPollInterval.current) {
                clearInterval(videoPollInterval.current);
            }
        };
    }, []);

    useEffect(() => {
        const firstRatio = Object.keys(assetTypes[assetType].ratios)[0] as AspectRatio;
        setAspectRatio(firstRatio);
    }, [assetType]);

    const handleGenerateImage = async () => {
        if (!imagePrompt) return;
        setIsGeneratingImage(true);
        setImageResult(null);
        setImageError(null);
        try {
            const baseImage = await generateImage(imagePrompt, aspectRatio);
            
            const needsEditing = logo || overlayText.trim();
            if (needsEditing) {
                let editPrompt = '';
                if (logo && overlayText.trim()) {
                    editPrompt = `Place the provided logo neatly in the bottom-right corner. Overlay the following text on the image in a clean, readable, sans-serif font: "${overlayText.trim()}". The text should be prominent but not cover key parts of the image.`;
                } else if (logo) {
                    editPrompt = "Place the provided logo neatly in the bottom-right corner of the main image. The logo should be visible but not obstructive, scaled appropriately for the image size.";
                } else if (overlayText.trim()) {
                    editPrompt = `Overlay the following text on the image in a clean, readable, sans-serif font: "${overlayText.trim()}". The text should be prominent but not cover key parts of the image.`;
                }
                const finalImage = await editImage(editPrompt, baseImage, logo || undefined);
                setImageResult(finalImage);
            } else {
                setImageResult(baseImage);
            }
        } catch (err) {
            console.error(err);
            setImageError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const pollVideoStatus = useCallback(async (operation: any) => {
        videoPollInterval.current = setInterval(async () => {
            try {
                const status = await checkVideoStatus(operation);
                if (status.done) {
                    if (videoPollInterval.current) clearInterval(videoPollInterval.current);
                    const downloadLink = status.response?.generatedVideos?.[0]?.video?.uri;
                    if (downloadLink) {
                        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                        const blob = await response.blob();
                        const videoUrl = URL.createObjectURL(blob);
                        setVideoResult(videoUrl);
                    } else {
                        throw new Error(status.error?.message || "Video generation completed but no video was found.");
                    }
                    setIsGeneratingVideo(false);
                } else {
                     setVideoStatusMessage(prev => {
                        const currentIndex = videoStatusMessages.indexOf(prev);
                        const nextIndex = (currentIndex + 1) % videoStatusMessages.length;
                        return videoStatusMessages[nextIndex];
                    });
                }
            } catch (err) {
                 if (videoPollInterval.current) clearInterval(videoPollInterval.current);
                console.error(err);
                setVideoError(err instanceof Error ? err.message : 'An unknown error occurred during polling.');
                setIsGeneratingVideo(false);
            }
        }, 10000);
    }, []);

    const handleGenerateVideo = async () => {
        if (!videoPrompt) return;
        setIsGeneratingVideo(true);
        setVideoResult(null);
        setVideoError(null);
        setVideoStatusMessage(videoStatusMessages[0]);
        try {
            const operation = await generateVideo(videoPrompt, videoAspectRatio);
            await pollVideoStatus(operation);
        } catch (err) {
             if (videoPollInterval.current) clearInterval(videoPollInterval.current);
            console.error(err);
            setVideoError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setIsGeneratingVideo(false);
        }
    };

    const handleEditVideo = async () => {
        if (!videoResult) return;
        setIsEditingVideo(true);
        setEditVideoError(null);
        try {
            const editedVideoUrl = await editVideo(editPrompt, videoResult, {
                musicTrack: selectedMusicTrack,
                editRegion: editRegion,
            });
            setVideoResult(editedVideoUrl);
        } catch (err) {
            console.error(err);
            setEditVideoError(err instanceof Error ? err.message : 'An unknown error occurred during video editing.');
        } finally {
            setIsEditingVideo(false);
        }
    };
    
    const TabButton: React.FC<{ tabId: 'image' | 'video', children: React.ReactNode }> = ({ tabId, children }) => (
        <button onClick={() => setActiveTab(tabId)} className={`px-6 py-3 text-lg font-semibold rounded-t-lg transition-colors focus:outline-none ${activeTab === tabId ? 'bg-white/60 dark:bg-black/40 border-b-2 border-cyan-400 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>
            {children}
        </button>
    );

    const commonInputClasses = "w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-400 focus:outline-none transition-all duration-300";

    return (
        <div className="container mx-auto animate-fade-in px-4 w-full">
            <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
                    Creative Studio
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                    Generate professionally branded images, marketing assets, and videos for your business in seconds.
                </p>
            </div>

            <div className="max-w-6xl mx-auto">
                <div className="flex justify-center border-b border-gray-300 dark:border-gray-700">
                    <TabButton tabId="image">Image Studio</TabButton>
                    <TabButton tabId="video">Video Studio</TabButton>
                </div>
                
                <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-b-xl shadow-2xl shadow-cyan-500/10 border border-t-0 border-gray-200 dark:border-gray-700/50 p-8">
                    {activeTab === 'image' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Marketing Asset Generation</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="asset-type" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">1. Asset Type</label>
                                        <select id="asset-type" value={assetType} onChange={e => setAssetType(e.target.value as AssetType)} className={commonInputClasses}>
                                            {Object.entries(assetTypes).map(([key, { name }]) => <option key={key} value={key}>{name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="aspect-ratio" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">2. Size / Format</label>
                                        <select id="aspect-ratio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)} className={commonInputClasses}>
                                            {Object.entries(assetTypes[assetType].ratios).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="image-prompt" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">3. Describe the image visual:</label>
                                    <textarea id="image-prompt" rows={4} value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} className={commonInputClasses} />
                                </div>
                                
                                <div>
                                    <label htmlFor="overlay-text" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">4. Add Text Overlay (Optional)</label>
                                    <input id="overlay-text" type="text" value={overlayText} onChange={e => setOverlayText(e.target.value)} placeholder="e.g., Grand Opening Sale" className={commonInputClasses} />
                                </div>

                                {!logo ? (
                                     <div className="text-sm bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-3 rounded-r-lg text-yellow-800 dark:text-yellow-200">
                                         To automatically brand your images, <button onClick={() => onNavigate('user-profile')} className="font-bold underline hover:text-yellow-600 dark:hover:text-yellow-100">upload a logo</button> in your profile.
                                     </div>
                                ) : (
                                    <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-800/50 p-2 rounded-lg">
                                        <img src={logo} alt="Your logo" className="h-10 w-10 object-contain bg-white dark:bg-gray-700 p-1 rounded" />
                                        <p className="text-sm text-gray-600 dark:text-gray-300">Your logo will be added automatically.</p>
                                    </div>
                                )}
                                <button onClick={handleGenerateImage} disabled={isGeneratingImage || !imagePrompt} className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105">
                                    {isGeneratingImage ? <LoadingIcon /> : <AIIcon />}
                                    <span>{isGeneratingImage ? 'Generating...' : 'Generate Asset'}</span>
                                </button>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg aspect-square flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700/50">
                                {isGeneratingImage && <div className="text-center space-y-3"><LoadingIcon /><p>AI is creating your image...</p></div>}
                                {imageError && <p className="text-red-500 text-center">{imageError}</p>}
                                {imageResult && <img src={imageResult} alt="Generated content" className="rounded-md object-contain max-h-full max-w-full" />}
                                {!isGeneratingImage && !imageError && !imageResult && <div className="text-center text-gray-500"><BriefcaseIcon /><p>Your generated asset will appear here.</p></div>}
                            </div>
                        </div>
                    )}
                    {activeTab === 'video' && (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">1. Promotional Video Creation</h3>
                                    <div>
                                        <label htmlFor="video-prompt" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Describe the video you want to create:</label>
                                        <textarea id="video-prompt" rows={3} value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} className={commonInputClasses} />
                                    </div>
                                    <div>
                                        <label htmlFor="video-aspect-ratio" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Select Aspect Ratio</label>
                                        <select id="video-aspect-ratio" value={videoAspectRatio} onChange={e => setVideoAspectRatio(e.target.value as AspectRatio)} className={commonInputClasses}>
                                            <option value="16:9">Widescreen (16:9)</option>
                                            <option value="1:1">Square (1:1)</option>
                                            <option value="9:16">Vertical (9:16)</option>
                                        </select>
                                    </div>
                                    <button onClick={handleGenerateVideo} disabled={isGeneratingVideo || !videoPrompt} className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold bg-fuchsia-500 text-white hover:bg-fuchsia-400 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105">
                                        {isGeneratingVideo ? <LoadingIcon /> : <AIIcon />}
                                        <span>{isGeneratingVideo ? 'Generating...' : 'Generate Video'}</span>
                                    </button>
                                </div>
                                {videoResult && !isGeneratingVideo && (
                                    <div className="pt-6 border-t border-gray-300 dark:border-gray-700 space-y-4 animate-fade-in">
                                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">2. AI Video Editor (Demo)</h3>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="music-track" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Select Music Track</label>
                                                <select id="music-track" value={selectedMusicTrack} onChange={e => setSelectedMusicTrack(e.target.value)} className={commonInputClasses}>
                                                    <option value="none">No Change</option>
                                                    <option value="epic_orchestral">Epic Orchestral</option>
                                                    <option value="lofi_beats">Chill Lo-fi Beats</option>
                                                    <option value="corporate_pop">Upbeat Corporate Pop</option>
                                                    <option value="ambient_drone">Ambient Drone</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="edit-region" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Apply Edit to Region</label>
                                                <select id="edit-region" value={editRegion} onChange={e => setEditRegion(e.target.value)} className={commonInputClasses}>
                                                    <option value="entire">Entire Video</option>
                                                    <option value="top_left">Top Left Corner</option>
                                                    <option value="center_focus">Center Focus</option>
                                                    <option value="bottom_third">Bottom Third</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="edit-prompt" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Describe Visual Effect (Optional)</label>
                                            <textarea id="edit-prompt" rows={2} value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="e.g., 'apply a black and white filter'" className={commonInputClasses} />
                                        </div>
                                         <div className="text-sm bg-cyan-100 dark:bg-cyan-900/30 border-l-4 border-cyan-500 p-3 rounded-r-lg text-cyan-800 dark:text-cyan-200">
                                            <strong>Note:</strong> Video-to-video editing is an emerging technology. This is a demonstration of the intended workflow.
                                        </div>
                                        <button onClick={handleEditVideo} disabled={isEditingVideo || (editPrompt.trim() === '' && selectedMusicTrack === 'none' && editRegion === 'entire')} className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105">
                                            {isEditingVideo ? <LoadingIcon /> : <AIIcon />}
                                            <span>{isEditingVideo ? 'Applying Edits...' : 'Apply AI Edit'}</span>
                                        </button>
                                         {editVideoError && <p className="text-red-500 text-sm text-center">{editVideoError}</p>}
                                    </div>
                                )}

                            </div>
                            <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg aspect-video flex items-center justify-center p-2 border border-gray-200 dark:border-gray-700/50 relative">
                                {isGeneratingVideo && <div className="text-center space-y-3"><LoadingIcon /><p>{videoStatusMessage}</p></div>}
                                {videoError && !isGeneratingVideo && <p className="text-red-500 text-center">{videoError}</p>}
                                {videoResult && (
                                    <>
                                        <video src={videoResult} controls autoPlay muted loop className="rounded-md max-h-full max-w-full" />
                                        {isEditingVideo && (
                                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 rounded-lg">
                                                <LoadingIcon />
                                                <p className="text-white">AI is applying your edits...</p>
                                            </div>
                                        )}
                                    </>
                                )}
                                {!isGeneratingVideo && !videoError && !videoResult && <div className="text-center text-gray-500"><BriefcaseIcon /><p>Your generated video will appear here.</p></div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessStudioPage;