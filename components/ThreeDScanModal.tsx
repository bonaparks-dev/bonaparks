import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LoadingIcon } from './IconComponents';
import { Panel } from './ui';
import { useLanguage } from '../i18n/LanguageContext';

interface ThreeDScanModalProps {
    onClose: () => void;
    onComplete: () => void;
}

const ThreeDScanModal: React.FC<ThreeDScanModalProps> = ({ onClose, onComplete }) => {
    const { t } = useLanguage();
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    /** Index into t.faceScan.steps, or null for the initial instruction. */
    const [scanStep, setScanStep] = useState<number | null>(null);
    const stepCount = t.faceScan.steps.length;

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
            setCameraError(false);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError(true);
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

        const interval = setInterval(() => {
            setScanProgress(prev => {
                const nextProgress = prev + 20;
                if (nextProgress <= 100) {
                    const messageIndex = Math.floor(nextProgress / 25);
                    if (messageIndex < stepCount) {
                        setScanStep(messageIndex);
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
    }, [cameraError, onComplete, stepCount]);

    return (
        <div
            className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-md"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <Panel className="w-full max-w-2xl overflow-hidden p-8">
                <div onClick={e => e.stopPropagation()}>
                    <h3 className="font-display text-3xl text-bone">{t.faceScan.title}</h3>

                    <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-line bg-ink">
                        <video ref={videoRef} autoPlay playsInline className="h-full w-full scale-x-[-1] object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-5/6 w-2/3 animate-pulse rounded-[50%] border-2 border-dashed border-accent/50" />
                        </div>
                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-ink/80 p-6 text-center text-sm text-accent">
                                {t.faceScan.cameraError}
                            </div>
                        )}
                    </div>

                    <div className="mt-8">
                        <p className="text-sm text-muted">{scanStep === null ? t.faceScan.initial : t.faceScan.steps[scanStep]}</p>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-line">
                            <div
                                className="h-full rounded-full bg-accent transition-all duration-500"
                                style={{ width: `${scanProgress}%` }}
                            />
                        </div>
                    </div>

                    {scanProgress >= 100 && (
                        <div className="mt-5 flex items-center gap-3 text-accent">
                            <LoadingIcon />
                            <span className="text-xs">{t.faceScan.processing}</span>
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
};

export default ThreeDScanModal;
