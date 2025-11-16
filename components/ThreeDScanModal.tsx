import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LoadingIcon } from './IconComponents';

interface ThreeDScanModalProps {
    onClose: () => void;
    onComplete: () => void;
}

const ThreeDScanModal: React.FC<ThreeDScanModalProps> = ({ onClose, onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanMessage, setScanMessage] = useState("Position your face in the oval.");

    const startCamera = useCallback(async () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError("Could not access camera. Please check browser permissions.");
        }
    }, []);
    
    useEffect(() => {
        startCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera]);

    useEffect(() => {
        if (cameraError) return;

        const messages = [
            "Slowly turn your head to the right.",
            "Now, slowly turn your head to the left.",
            "Tilt your head slightly up.",
            "Finally, look straight ahead.",
            "Scan complete! Processing...",
        ];
        
        const interval = setInterval(() => {
            setScanProgress(prev => {
                const nextProgress = prev + 20;
                if (nextProgress <= 100) {
                    const messageIndex = Math.floor(nextProgress / 25);
                    if (messages[messageIndex]) {
                        setScanMessage(messages[messageIndex]);
                    }
                    return nextProgress;
                } else {
                    clearInterval(interval);
                    setTimeout(onComplete, 1500);
                    return 100;
                }
            });
        }, 1200);

        return () => clearInterval(interval);
    }, [cameraError, onComplete]);


    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 w-full max-w-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">3D Face Scan</h3>
                    <div className="relative bg-gray-200 dark:bg-black rounded-lg overflow-hidden aspect-video">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2/3 h-5/6 border-4 border-dashed border-cyan-400/50 rounded-[50%] animate-pulse"></div>
                        </div>
                        {cameraError && <div className="absolute inset-0 flex items-center justify-center text-center text-red-500 dark:text-red-400 p-4 bg-black/50">{cameraError}</div>}
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">{scanMessage}</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div className="bg-cyan-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${scanProgress}%` }}></div>
                        </div>
                    </div>
                     {scanProgress >= 100 && (
                        <div className="flex items-center justify-center space-x-2 mt-4 text-cyan-500 dark:text-cyan-300">
                            <LoadingIcon />
                            <span>Processing scan data...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThreeDScanModal;
