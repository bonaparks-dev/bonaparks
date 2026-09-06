import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LoadingIcon } from './IconComponents';
import { Panel } from './ui';

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
            "Scan complete. Processing...",
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
            className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-md"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <Panel className="w-full max-w-2xl overflow-hidden p-8">
                <div onClick={e => e.stopPropagation()}>
                    <h3 className="font-display text-3xl text-bone">3D face scan</h3>

                    <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-line bg-ink">
                        <video ref={videoRef} autoPlay playsInline className="h-full w-full scale-x-[-1] object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-5/6 w-2/3 animate-pulse rounded-[50%] border-2 border-dashed border-gold/50" />
                        </div>
                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-ink/80 p-6 text-center text-sm text-gold">
                                {cameraError}
                            </div>
                        )}
                    </div>

                    <div className="mt-8">
                        <p className="text-sm text-muted">{scanMessage}</p>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-line">
                            <div
                                className="h-full rounded-full bg-gold transition-all duration-500"
                                style={{ width: `${scanProgress}%` }}
                            />
                        </div>
                    </div>

                    {scanProgress >= 100 && (
                        <div className="mt-5 flex items-center gap-3 text-gold">
                            <LoadingIcon />
                            <span className="text-xs uppercase tracking-widest2">Processing scan data</span>
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
};

export default ThreeDScanModal;
