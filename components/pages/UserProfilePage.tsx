import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UserIcon, CameraIcon, ClipboardIcon, BellIcon, ShieldCheckIcon, LockClosedIcon, LogoutIcon } from '../IconComponents';

const CameraModal: React.FC<{
    onClose: () => void;
    onCapture: (dataUrl: string) => void;
}> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setCameraError("Could not access the camera. Please check your browser permissions.");
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


    const takePicture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/png');
                onCapture(dataUrl);
            }
        }
    };

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
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">Live Camera Feed</h3>
                    <div className="relative bg-gray-200 dark:bg-black rounded-lg overflow-hidden aspect-video">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        {cameraError && <div className="absolute inset-0 flex items-center justify-center text-center text-red-500 dark:text-red-400 p-4">{cameraError}</div>}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex justify-center space-x-4 mt-6">
                        <button onClick={onClose} className="px-6 py-2 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button onClick={takePicture} disabled={!!cameraError} className="px-6 py-2 rounded-lg font-semibold bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                            Take Picture
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsSection: React.FC<{ title: string, children: React.ReactNode, border?: boolean }> = ({ title, children, border = true }) => (
    <div className={`space-y-4 ${border ? 'border-t border-gray-200 dark:border-gray-700/50 pt-6' : ''}`}>
        <h3 className="text-xl font-bold text-cyan-600 dark:text-cyan-300 tracking-wider">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const ToggleSwitch: React.FC<{ label: string, enabled: boolean, onToggle: (enabled: boolean) => void }> = ({ label, enabled, onToggle }) => (
    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <button
            onClick={() => onToggle(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-cyan-500' : 'bg-gray-400 dark:bg-gray-600'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
        </button>
    </div>
);


interface UserProfilePageProps {
    walletAddress: string | null;
    handleLogout: () => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ walletAddress, handleLogout }) => {
    const userEmail = "visitor@bonaparks.com";
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [logo, setLogo] = useState<string | null>(null);
    const [username, setUsername] = useState('DigitalVoyager');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');
    const [notifications, setNotifications] = useState({
        events: true,
        promos: false,
        security: true
    });

    useEffect(() => {
        const savedLogo = localStorage.getItem('user-logo');
        if (savedLogo) {
            setLogo(savedLogo);
        }
    }, []);

    const handleCapture = (dataUrl: string) => {
        setProfilePicture(dataUrl);
        setIsCameraOpen(false);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                localStorage.setItem('user-logo', base64String);
                setLogo(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        localStorage.removeItem('user-logo');
        setLogo(null);
    };
    
    const copyToClipboard = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress).then(() => {
                setCopySuccess('Copied!');
                setTimeout(() => setCopySuccess(''), 2000);
            });
        }
    };
    
    const handleNotificationToggle = (key: keyof typeof notifications) => {
        setNotifications(prev => ({...prev, [key]: !prev[key]}));
    };

    return (
        <div className="w-full max-w-3xl animate-fade-in">
            <div className="bg-white/70 dark:bg-black/50 backdrop-blur-lg rounded-xl shadow-2xl shadow-cyan-500/10 border border-gray-200 dark:border-gray-700/50 overflow-hidden p-8">
                <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white tracking-wider mb-8">
                    My Profile
                </h2>
                
                <div className="space-y-8">
                    {/* Profile Section */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="relative flex-shrink-0">
                            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-cyan-500/50 flex items-center justify-center overflow-hidden">
                                {profilePicture ? (
                                    <img src={profilePicture} alt="User profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon />
                                )}
                            </div>
                            <button onClick={() => setIsCameraOpen(true)} className="absolute bottom-0 right-0 bg-cyan-500 text-white p-2 rounded-full hover:bg-cyan-400 transition-colors">
                                <CameraIcon />
                            </button>
                        </div>
                        <div className="text-center md:text-left flex-grow">
                             <div className="flex items-center space-x-2">
                                <input 
                                    type="text" 
                                    value={username} 
                                    onChange={(e) => setUsername(e.target.value)} 
                                    className="text-2xl bg-transparent font-bold text-gray-900 dark:text-white border-b-2 border-transparent focus:outline-none focus:border-cyan-400"
                                />
                            </div>
                            {walletAddress ? (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Wallet Connected</p>
                            ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-mono">{userEmail}</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Wallet Details Section */}
                    {walletAddress && (
                        <SettingsSection title="Wallet Details" border={false}>
                             <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Address</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-mono text-fuchsia-600 dark:text-fuchsia-300 text-sm">{`${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`}</span>
                                        <button onClick={copyToClipboard} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                                            <ClipboardIcon />
                                        </button>
                                        {copySuccess && <span className="text-cyan-500 dark:text-cyan-300 text-xs">{copySuccess}</span>}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Network</span>
                                    <span className="font-mono text-sm text-gray-800 dark:text-white">BonaChain (Testnet)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Balance</span>
                                    <span className="font-mono text-sm text-gray-800 dark:text-white">0.42 ETH</span>
                                </div>
                            </div>
                        </SettingsSection>
                    )}

                    {/* Business Assets */}
                    <SettingsSection title="Business Assets">
                        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-gray-800 dark:text-white">Company Logo</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Used for branding AI-generated content.</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                {logo && (
                                    <>
                                        <img src={logo} alt="Company logo" className="h-12 w-12 object-contain bg-white dark:bg-gray-700 p-1 rounded" />
                                        <button onClick={removeLogo} className="text-sm text-red-500 hover:underline">Remove</button>
                                    </>
                                )}
                                <input type="file" id="logo-upload" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoUpload} />
                                <label htmlFor="logo-upload" className="cursor-pointer text-sm font-semibold bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors">
                                    {logo ? 'Change' : 'Upload'}
                                </label>
                            </div>
                        </div>
                    </SettingsSection>

                    {/* Notification Settings */}
                    <SettingsSection title="Notification Settings">
                        <ToggleSwitch label="Event Reminders & Updates" enabled={notifications.events} onToggle={() => handleNotificationToggle('events')} />
                        <ToggleSwitch label="Promotional Updates" enabled={notifications.promos} onToggle={() => handleNotificationToggle('promos')} />
                        <ToggleSwitch label="Security Alerts" enabled={notifications.security} onToggle={() => handleNotificationToggle('security')} />
                    </SettingsSection>

                    {/* Security */}
                     <SettingsSection title="Security">
                        {!walletAddress && (
                            <button className="w-full flex justify-between items-center text-left bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800/80 transition-colors">
                                <span className="text-gray-700 dark:text-gray-300">Change Password</span>
                                <LockClosedIcon />
                            </button>
                        )}
                         <button className="w-full flex justify-between items-center text-left bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800/80 transition-colors">
                            <span className="text-gray-700 dark:text-gray-300">Two-Factor Authentication</span>
                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-200 dark:bg-yellow-900/50 px-2 py-1 rounded">Not Enabled</span>
                        </button>
                    </SettingsSection>

                    {/* Danger Zone */}
                    <div className="border-t border-red-500/30 pt-6 space-y-4">
                        <h3 className="text-xl font-bold text-red-500 dark:text-red-400 tracking-wider">Danger Zone</h3>
                        <div className="space-y-3">
                            <button onClick={handleLogout} className="w-full flex justify-between items-center text-left bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                <span className="text-gray-700 dark:text-gray-300">{walletAddress ? "Disconnect Wallet" : "Log Out"}</span>
                                <LogoutIcon />
                            </button>
                             <button className="w-full flex justify-between items-center text-left bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 p-3 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors">
                                <span>Delete Account</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {isCameraOpen && (
                <CameraModal 
                    onClose={() => setIsCameraOpen(false)}
                    onCapture={handleCapture}
                />
            )}
        </div>
    );
};

export default UserProfilePage;