import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UserIcon, CameraIcon, ClipboardIcon, LockClosedIcon, LogoutIcon } from '../IconComponents';
import { Button, PageHeader, PageShell, Panel } from '../ui';

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
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <Panel className="w-full max-w-2xl overflow-hidden p-8" >
        <div onClick={e => e.stopPropagation()}>
          <h3 className="font-display text-3xl text-bone">Live camera feed</h3>
          <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-line bg-ink">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-accent">
                {cameraError}
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-8 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={takePicture} disabled={!!cameraError}>Take picture</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
};

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="border-t border-line pt-8">
    <h2 className="text-[11px] font-semibold uppercase tracking-widest2 text-accent">{title}</h2>
    <div className="mt-5 space-y-3">{children}</div>
  </section>
);

const rowClasses =
  'flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-elev p-4 text-left';

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onToggle: (enabled: boolean) => void }> = ({ label, enabled, onToggle }) => (
  <div className={rowClasses}>
    <span className="text-sm text-muted">{label}</span>
    <button
      onClick={() => onToggle(!enabled)}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        enabled ? 'bg-accent' : 'bg-line'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-bone transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
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
    security: true,
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
        setCopySuccess('Copied');
        setTimeout(() => setCopySuccess(''), 2000);
      });
    }
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <PageShell className="max-w-3xl">
        <PageHeader eyebrow="My account" title="My profile" />

        <Panel className="mt-12 p-8 md:p-10">
          {/* Identity */}
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <div className="relative flex-shrink-0">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-line bg-elev text-muted">
                {profilePicture ? (
                  <img src={profilePicture} alt="User profile" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon />
                )}
              </div>
              <button
                onClick={() => setIsCameraOpen(true)}
                className="absolute bottom-0 right-0 rounded-full bg-accent p-2 text-on-accent transition-colors hover:bg-bone"
                aria-label="Take a profile picture"
              >
                <CameraIcon />
              </button>
            </div>

            <div className="flex-grow text-center md:text-left">
              <label htmlFor="username" className="text-[11px] font-semibold uppercase tracking-widest2 text-muted">
                Display name
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full border-b border-line bg-transparent pb-2 font-display text-3xl text-bone focus:border-accent focus:outline-none"
              />
              <p className="mt-3 text-sm text-muted">
                {walletAddress ? 'Wallet connected' : userEmail}
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-8">
            {walletAddress && (
              <SettingsSection title="Wallet details">
                <div className="space-y-3 rounded-xl border border-line bg-elev p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted">Address</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-accent">{`${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`}</span>
                      <button
                        onClick={copyToClipboard}
                        className="text-muted transition-colors hover:text-bone"
                        aria-label="Copy wallet address"
                      >
                        <ClipboardIcon />
                      </button>
                      {copySuccess && <span className="text-xs text-accent">{copySuccess}</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted">Network</span>
                    <span className="text-sm text-bone">BonaChain (Testnet)</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted">Balance</span>
                    <span className="text-sm text-bone">0.42 ETH</span>
                  </div>
                </div>
              </SettingsSection>
            )}

            <SettingsSection title="Business assets">
              <div className={rowClasses}>
                <div>
                  <h3 className="text-sm font-semibold text-bone">Company logo</h3>
                  <p className="mt-1 text-xs text-muted">Used for branding AI-generated content.</p>
                </div>
                <div className="flex items-center gap-4">
                  {logo && (
                    <>
                      <img src={logo} alt="Company logo" className="h-12 w-12 rounded bg-bone object-contain p-1" />
                      <button onClick={removeLogo} className="text-xs text-muted transition-colors hover:text-accent">
                        Remove
                      </button>
                    </>
                  )}
                  <input type="file" id="logo-upload" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoUpload} />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer rounded-full border border-line px-5 py-2 text-xs font-semibold uppercase tracking-widest2 text-bone transition-colors hover:border-accent hover:text-accent"
                  >
                    {logo ? 'Change' : 'Upload'}
                  </label>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection title="Notifications">
              <ToggleSwitch label="Event reminders and updates" enabled={notifications.events} onToggle={() => handleNotificationToggle('events')} />
              <ToggleSwitch label="Promotional updates" enabled={notifications.promos} onToggle={() => handleNotificationToggle('promos')} />
              <ToggleSwitch label="Security alerts" enabled={notifications.security} onToggle={() => handleNotificationToggle('security')} />
            </SettingsSection>

            <SettingsSection title="Security">
              {!walletAddress && (
                <button className={`${rowClasses} transition-colors hover:border-accent/40`}>
                  <span className="text-sm text-muted">Change password</span>
                  <LockClosedIcon />
                </button>
              )}
              <button className={`${rowClasses} transition-colors hover:border-accent/40`}>
                <span className="text-sm text-muted">Two-factor authentication</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest2 text-accent">Not enabled</span>
              </button>
            </SettingsSection>

            <SettingsSection title="Danger zone">
              <button
                onClick={handleLogout}
                className={`${rowClasses} transition-colors hover:border-accent/40`}
              >
                <span className="text-sm text-muted">{walletAddress ? 'Disconnect wallet' : 'Log out'}</span>
                <LogoutIcon />
              </button>
              <button className={`${rowClasses} border-accent/30 transition-colors hover:border-accent`}>
                <span className="text-sm text-accent">Delete account</span>
              </button>
            </SettingsSection>
          </div>
        </Panel>
      </PageShell>

      {isCameraOpen && (
        <CameraModal
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCapture}
        />
      )}
    </>
  );
};

export default UserProfilePage;
