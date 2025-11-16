import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon, FileIcon, TrashIcon, AIIcon, CheckCircleIcon, LoadingIcon } from '../IconComponents';

const NpcDemo: React.FC = () => {
    const [npcResponse, setNpcResponse] = useState("Hello! Ask me about our capabilities.");
    const questions = {
        "What is your latency?": "Our AI is optimized for real-time interaction, with response times under 200ms.",
        "Can you be customized?": "Absolutely. My personality, knowledge base, and appearance are fully customizable to fit your brand.",
        "Do you support multiple languages?": "Yes, I can be configured to interact in over 50 languages."
    };

    return (
        <div className="text-sm p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg h-full flex flex-col">
            <div className="flex items-start space-x-2 flex-grow">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center border border-cyan-200 dark:border-cyan-500/30">
                    <AIIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-300"/>
                </div>
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-gray-700 dark:text-gray-300">
                    <p>{npcResponse}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-3">
                {Object.entries(questions).map(([q, a]) => (
                    <button key={q} onClick={() => setNpcResponse(a)} className="text-left text-xs bg-gray-200 dark:bg-gray-700/60 hover:bg-gray-300 dark:hover:bg-gray-700 p-2 rounded transition-colors text-gray-700 dark:text-gray-200">
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
};

const PersonalizationDemo: React.FC = () => {
    const allItems = [
        { title: "Live DJ Set", tags: ["Music", "Social"], img: "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" },
        { title: "Art Gallery Opening", tags: ["Art", "Culture"], img: "https://images.pexels.com/photos/1578332/pexels-photo-1578332.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" },
        { title: "VR Escape Room", tags: ["Gaming", "Social"], img: "https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" },
    ];
    const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

    const toggleTag = (tag: string) => {
        setActiveTags(prev => {
            const newTags = new Set(prev);
            if (newTags.has(tag)) newTags.delete(tag);
            else newTags.add(tag);
            return newTags;
        });
    };
    
    const sortedItems = [...allItems].sort((a, b) => {
        const scoreA = a.tags.filter(t => activeTags.has(t)).length;
        const scoreB = b.tags.filter(t => activeTags.has(t)).length;
        return scoreB - scoreA;
    });

    return (
        <div className="text-sm p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg h-full flex flex-col">
            <div className="flex items-center justify-center space-x-2 mb-3">
                {["Music", "Art", "Social", "Gaming"].map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)} className={`px-2 py-1 text-xs rounded-full border transition-all ${activeTags.has(tag) ? 'bg-lime-400 text-black border-lime-400' : 'bg-gray-200 dark:bg-gray-700/60 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}>
                        {tag}
                    </button>
                ))}
            </div>
            <div className="space-y-2">
                {sortedItems.map(item => {
                    const isRecommended = item.tags.some(t => activeTags.has(t));
                    return (
                        <div key={item.title} className={`relative p-2 rounded-md bg-white dark:bg-gray-800 flex items-center space-x-2 transition-all duration-300 ${isRecommended && activeTags.size > 0 ? 'ring-2 ring-lime-400 scale-105' : 'scale-100'}`}>
                            <img src={item.img} className="w-8 h-8 rounded object-cover" />
                            <span className="text-xs text-gray-700 dark:text-gray-300">{item.title}</span>
                            {isRecommended && activeTags.size > 0 && <span className="absolute -top-1 -right-1 text-[10px] bg-lime-400 text-black font-bold px-1.5 py-0.5 rounded-full">REC</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const InteractiveWorldDemo: React.FC = () => {
    return (
        <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg h-full flex items-center justify-center">
             <div className="relative w-full h-48 rounded-lg overflow-hidden group">
                 <img src="https://images.pexels.com/photos/2114365/pexels-photo-2114365.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/30"></div>
                 <div className="absolute top-1/4 left-1/3 animate-pulse">
                     <div className="w-4 h-4 rounded-full bg-cyan-400 cursor-pointer"></div>
                     <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-800 text-xs text-white px-2 py-1 rounded">Interactive DJ Booth</div>
                 </div>
                 <div className="absolute bottom-1/4 right-1/4 animate-pulse" style={{ animationDelay: '0.5s'}}>
                     <div className="w-4 h-4 rounded-full bg-cyan-400 cursor-pointer"></div>
                     <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-800 text-xs text-white px-2 py-1 rounded">Player-triggered Visuals</div>
                 </div>
             </div>
        </div>
    );
};

const DemoCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-bold text-lime-700 dark:text-lime-300 text-center">{title}</h4>
        </div>
        <div className="p-4 flex-grow">{children}</div>
    </div>
);


const RfpUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleFile = (selectedFile: File | null) => {
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                setError("File size cannot exceed 10MB.");
                return;
            }
            if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
                setError("Invalid file type. Please upload PDF or DOCX.");
                return;
            }
            setFile(selectedFile);
            setUploadStatus('idle');
            setError(null);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file) return;
        setUploadStatus('uploading');
        setError(null);
        setTimeout(() => {
            setUploadStatus('success');
            setFile(null);
        }, 2000);
    };

    const removeFile = () => {
        setFile(null);
        setUploadStatus('idle');
        setError(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    if (uploadStatus === 'success') {
        return (
            <div className="text-center p-8 bg-white/60 dark:bg-black/40 border border-green-500/30 rounded-lg">
                <CheckCircleIcon />
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-4">RFP Submitted Successfully</h4>
                <p className="text-gray-600 dark:text-gray-400">Our team will review your document and be in touch shortly.</p>
                <button onClick={() => setUploadStatus('idle')} className="mt-4 text-sm font-semibold text-lime-600 dark:text-lime-300 hover:underline">Submit another RFP</button>
            </div>
        );
    }
    
    return (
        <div className="bg-white/60 dark:bg-black/40 p-8 rounded-xl border border-lime-500/20 shadow-lg shadow-lime-500/5">
            <div
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDragging ? 'border-lime-400 bg-lime-500/10' : 'border-gray-400 dark:border-gray-600 hover:border-gray-500'
                }`}
            >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
                <UploadCloudIcon />
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-lime-600 dark:text-lime-300">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF, DOC, or DOCX (MAX. 10MB)</p>
            </div>

            {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-center">{error}</p>}

            {file && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <FileIcon />
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button onClick={removeFile} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"><TrashIcon /></button>
                </div>
            )}
            <button
                onClick={handleUpload}
                disabled={!file || uploadStatus === 'uploading'}
                className="w-full mt-6 py-3 rounded-lg font-semibold bg-lime-500 text-black hover:bg-lime-400 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
                {uploadStatus === 'uploading' && <LoadingIcon />}
                <span>{uploadStatus === 'uploading' ? 'Submitting...' : 'Submit Securely'}</span>
            </button>
        </div>
    );
};

const ContactForm: React.FC = () => {
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // This is for display only. In a real app, this would trigger an API call.
        setIsSubmitted(true);
    };
    
    if (isSubmitted) {
         return (
            <div className="text-center p-8 bg-white/60 dark:bg-black/40 border border-green-500/30 rounded-lg">
                <CheckCircleIcon />
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-4">Thank You!</h4>
                <p className="text-gray-600 dark:text-gray-400">Your message has been sent. We'll get back to you soon.</p>
                <button onClick={() => setIsSubmitted(false)} className="mt-4 text-sm font-semibold text-lime-600 dark:text-lime-300 hover:underline">Send another message</button>
            </div>
        );
    }

    return (
        <div className="bg-white/60 dark:bg-black/40 p-8 rounded-xl border border-lime-500/20 shadow-lg shadow-lime-500/5">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Full Name</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 focus:outline-none transition-all duration-300" />
                    </div>
                    <div>
                        <label htmlFor="company" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Company</label>
                        <input id="company" type="text" value={company} onChange={e => setCompany(e.target.value)} required className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 focus:outline-none transition-all duration-300" />
                    </div>
                </div>
                <div>
                    <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Email Address</label>
                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 focus:outline-none transition-all duration-300" />
                </div>
                <div>
                    <label htmlFor="message" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Message</label>
                    <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} required rows={4} className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 focus:outline-none transition-all duration-300"></textarea>
                </div>
                <button type="submit" disabled={!name || !company || !email || !message} className="w-full py-3 rounded-lg font-semibold bg-lime-500 text-black hover:bg-lime-400 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Send Message
                </button>
            </form>
        </div>
    );
};

const MatterportIntegration: React.FC = () => {
    const [link, setLink] = useState('https://discover.matterport.com/space/dSJ6ko28ARr');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setTimeout(() => {
            setStatus('success');
        }, 1500);
    };

    if (status === 'success') {
        return (
             <div className="text-center p-8 bg-white/60 dark:bg-black/40 border border-green-500/30 rounded-lg">
                <CheckCircleIcon />
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-4">Scan Link Submitted</h4>
                <p className="text-gray-600 dark:text-gray-400">Your digital twin is being processed for integration.</p>
                <button onClick={() => setStatus('idle')} className="mt-4 text-sm font-semibold text-lime-600 dark:text-lime-300 hover:underline">Submit another link</button>
            </div>
        )
    }

    return (
         <div className="bg-white/60 dark:bg-black/40 p-8 rounded-xl border border-lime-500/20 shadow-lg shadow-lime-500/5">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="matterport-link" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">3D Scan Public URL</label>
                    <input 
                        id="matterport-link" 
                        type="url" 
                        value={link} 
                        onChange={e => setLink(e.target.value)} 
                        required 
                        placeholder="https://my.matterport.com/show/?m=XXXXXXXXXXX"
                        className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 focus:outline-none transition-all duration-300" 
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={!link || status === 'submitting'} 
                    className="w-full py-3 rounded-lg font-semibold bg-lime-500 text-black hover:bg-lime-400 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    {status === 'submitting' && <LoadingIcon />}
                    <span>{status === 'submitting' ? 'Verifying Link...' : 'Submit for Integration'}</span>
                </button>
            </form>
        </div>
    )
}

const B2BHubPage: React.FC = () => {
    return (
        <div className="container mx-auto animate-fade-in px-4 w-full">
            <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.2)' }}>
                    B2B Solutions Hub
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
                    Explore our enterprise solutions and partner with us to build the future of digital interaction.
                </p>
            </div>

            <section id="demos" className="mb-16">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Interactive Solutions Demo</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">Experience the power of our AI and simulation technology firsthand.</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    <DemoCard title="Dynamic NPCs"><NpcDemo /></DemoCard>
                    <DemoCard title="Personalized Experiences"><PersonalizationDemo /></DemoCard>
                    <DemoCard title="Interactive Worlds"><InteractiveWorldDemo /></DemoCard>
                </div>
            </section>

            <section id="integrate-scan" className="mb-16">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Integrate Your Digital Twin</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-2xl mx-auto">
                    Already have a 3D scan of your venue? Link your Matterport, GeoCV, or other digital twin platform to integrate it directly into the Bona Parks ecosystem.
                </p>
                <div className="max-w-2xl mx-auto">
                    <MatterportIntegration />
                </div>
            </section>

            <section id="rfp-upload" className="mb-16">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Submit Your Request for Proposal</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-2xl mx-auto">
                    Have a project in mind? Securely upload your RFP document. Our solutions architects will review it and respond within 48 business hours.
                </p>
                <div className="max-w-2xl mx-auto">
                    <RfpUpload />
                </div>
            </section>

            <section id="contact-us">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">Contact Our Team</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-2xl mx-auto">
                    Have a general inquiry or need more information? Fill out the form below, and our partnership team will get in touch.
                </p>
                <div className="max-w-2xl mx-auto">
                    <ContactForm />
                </div>
            </section>
        </div>
    );
};

export default B2BHubPage;
