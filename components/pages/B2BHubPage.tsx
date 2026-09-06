import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon, FileIcon, TrashIcon, AIIcon, CheckCircleIcon, LoadingIcon } from '../IconComponents';
import { Button, Eyebrow, Field, PageHeader, PageShell, Panel } from '../ui';

const sectionTitle = 'font-display text-3xl md:text-4xl text-bone';
const sectionIntro = 'mt-3 max-w-2xl text-sm leading-relaxed text-muted';
const textareaClasses =
  'w-full rounded-lg border border-line bg-ink px-4 py-3 text-bone placeholder-muted/60 transition-colors duration-300 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold';

/** Green-tinted confirmation block shared by the three forms. */
const SuccessPanel: React.FC<{
  title: string;
  body: string;
  actionLabel: string;
  onReset: () => void;
}> = ({ title, body, actionLabel, onReset }) => (
  <Panel className="p-10 text-center">
    <div className="flex justify-center text-gold">
      <CheckCircleIcon />
    </div>
    <h4 className="mt-5 font-display text-2xl text-bone">{title}</h4>
    <p className="mt-3 text-sm text-muted">{body}</p>
    <button
      onClick={onReset}
      className="mt-6 text-xs font-semibold uppercase tracking-widest2 text-gold transition-colors hover:text-bone"
    >
      {actionLabel}
    </button>
  </Panel>
);

const NpcDemo: React.FC = () => {
  const [npcResponse, setNpcResponse] = useState('Hello! Ask me about our capabilities.');
  const questions = {
    'What is your latency?': 'Our AI is optimized for real-time interaction, with response times under 200ms.',
    'Can you be customized?': 'Absolutely. My personality, knowledge base, and appearance are fully customizable to fit your brand.',
    'Do you support multiple languages?': 'Yes, I can be configured to interact in over 50 languages.',
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-grow items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-ink">
          <AIIcon className="h-4 w-4 text-gold" />
        </div>
        <p className="rounded-lg border border-line bg-ink p-3 text-xs leading-relaxed text-muted">
          {npcResponse}
        </p>
      </div>
      <div className="mt-4 space-y-2">
        {Object.entries(questions).map(([question, answer]) => (
          <button
            key={question}
            onClick={() => setNpcResponse(answer)}
            className="block w-full rounded-lg border border-line px-3 py-2 text-left text-xs text-muted transition-colors hover:border-gold/40 hover:text-bone"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

const PersonalizationDemo: React.FC = () => {
  const allItems = [
    { title: 'Live DJ Set', tags: ['Music', 'Social'], img: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
    { title: 'Art Gallery Opening', tags: ['Art', 'Culture'], img: 'https://images.pexels.com/photos/1578332/pexels-photo-1578332.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
    { title: 'VR Escape Room', tags: ['Gaming', 'Social'], img: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
  ];
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const newTags = new Set(prev);
      if (newTags.has(tag)) newTags.delete(tag);
      else newTags.add(tag);
      return newTags;
    });
  };

  const sortedItems = [...allItems].sort((a, b) => {
    const scoreA = a.tags.filter((t) => activeTags.has(t)).length;
    const scoreB = b.tags.filter((t) => activeTags.has(t)).length;
    return scoreB - scoreA;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap justify-center gap-2">
        {['Music', 'Art', 'Social', 'Gaming'].map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest2 transition-colors ${
              activeTags.has(tag)
                ? 'border-gold bg-gold text-ink'
                : 'border-line text-muted hover:text-bone'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {sortedItems.map((item) => {
          const isRecommended = item.tags.some((t) => activeTags.has(t)) && activeTags.size > 0;
          return (
            <div
              key={item.title}
              className={`flex items-center gap-3 rounded-lg border p-2 transition-colors duration-300 ${
                isRecommended ? 'border-gold bg-ink' : 'border-line bg-ink'
              }`}
            >
              <img src={item.img} alt="" className="h-9 w-9 rounded object-cover" />
              <span className="text-xs text-muted">{item.title}</span>
              {isRecommended && (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest2 text-gold">
                  Rec
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InteractiveWorldDemo: React.FC = () => (
  <div className="group relative h-full min-h-[220px] overflow-hidden rounded-lg border border-line">
    <img
      src="https://images.pexels.com/photos/2114365/pexels-photo-2114365.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
      alt=""
      className="h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-ink/50" aria-hidden="true" />
    <div className="absolute left-1/3 top-1/4 animate-pulse">
      <div className="h-3 w-3 cursor-pointer rounded-full bg-gold" />
      <div className="absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 rounded bg-ink px-2 py-1 text-[10px] text-bone group-hover:block">
        Interactive DJ booth
      </div>
    </div>
    <div className="absolute bottom-1/4 right-1/4 animate-pulse" style={{ animationDelay: '0.5s' }}>
      <div className="h-3 w-3 cursor-pointer rounded-full bg-gold" />
      <div className="absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 rounded bg-ink px-2 py-1 text-[10px] text-bone group-hover:block">
        Player-triggered visuals
      </div>
    </div>
  </div>
);

const DemoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Panel className="flex flex-col">
    <div className="border-b border-line px-6 py-4">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest2 text-gold">{title}</h4>
    </div>
    <div className="flex-grow p-6">{children}</div>
  </Panel>
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
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size cannot exceed 10MB.');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
        setError('Invalid file type. Please upload PDF or DOCX.');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (uploadStatus === 'success') {
    return (
      <SuccessPanel
        title="RFP submitted"
        body="Our team will review your document and be in touch shortly."
        actionLabel="Submit another RFP"
        onReset={() => setUploadStatus('idle')}
      />
    );
  }

  return (
    <Panel className="p-8 md:p-10">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center transition-colors ${
          isDragging ? 'border-gold bg-gold/5' : 'border-line hover:border-gold/50'
        }`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
        <span className="text-muted">
          <UploadCloudIcon />
        </span>
        <p className="mt-2 text-sm text-muted">
          <span className="font-semibold text-gold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted/70">PDF, DOC or DOCX &middot; max 10MB</p>
      </div>

      {error && <p className="mt-3 text-center text-xs text-gold">{error}</p>}

      {file && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-ink p-3">
          <div className="flex items-center gap-3">
            <span className="text-muted">
              <FileIcon />
            </span>
            <div>
              <p className="text-sm text-bone">{file.name}</p>
              <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="text-muted transition-colors hover:text-gold"
            aria-label={`Remove ${file.name}`}
          >
            <TrashIcon />
          </button>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || uploadStatus === 'uploading'}
        className="mt-8 w-full"
      >
        {uploadStatus === 'uploading' && <LoadingIcon />}
        <span>{uploadStatus === 'uploading' ? 'Submitting...' : 'Submit securely'}</span>
      </Button>
    </Panel>
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
      <SuccessPanel
        title="Message sent"
        body="Thank you. We will get back to you soon."
        actionLabel="Send another message"
        onReset={() => setIsSubmitted(false)}
      />
    );
  }

  return (
    <Panel className="p-8 md:p-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field id="name" label="Full name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          <Field id="company" label="Company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} required />
        </div>
        <Field id="email" label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div>
          <label htmlFor="message" className="mb-2 block text-xs font-semibold uppercase tracking-widest2 text-muted">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className={textareaClasses}
          />
        </div>
        <Button type="submit" disabled={!name || !company || !email || !message} className="w-full">
          Send message
        </Button>
      </form>
    </Panel>
  );
};

const MatterportIntegration: React.FC = () => {
  const [link, setLink] = useState('');
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
      <SuccessPanel
        title="Scan link submitted"
        body="Your digital twin is being processed for integration."
        actionLabel="Submit another link"
        onReset={() => setStatus('idle')}
      />
    );
  }

  return (
    <Panel className="p-8 md:p-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          id="matterport-link"
          label="3D scan public URL"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          required
          placeholder="https://my.matterport.com/show/?m=XXXXXXXXXXX"
        />
        <Button type="submit" disabled={!link || status === 'submitting'} className="w-full">
          {status === 'submitting' && <LoadingIcon />}
          <span>{status === 'submitting' ? 'Verifying link...' : 'Submit for integration'}</span>
        </Button>
      </form>
    </Panel>
  );
};

const B2BHubPage: React.FC = () => (
  <PageShell>
    <PageHeader
      eyebrow="For business"
      title="Business Studio"
      intro="Explore our enterprise solutions and partner with us to build the future of digital interaction."
    />

    <section id="demos" className="mt-20">
      <Eyebrow>Interactive demos</Eyebrow>
      <h2 className={`mt-5 ${sectionTitle}`}>See the technology work</h2>
      <p className={sectionIntro}>
        Experience the power of our AI and simulation technology firsthand.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <DemoCard title="Dynamic NPCs"><NpcDemo /></DemoCard>
        <DemoCard title="Personalized experiences"><PersonalizationDemo /></DemoCard>
        <DemoCard title="Interactive worlds"><InteractiveWorldDemo /></DemoCard>
      </div>
    </section>

    <section id="integrate-scan" className="mt-24">
      <Eyebrow>Integration</Eyebrow>
      <h2 className={`mt-5 ${sectionTitle}`}>Integrate your digital twin</h2>
      <p className={sectionIntro}>
        Already have a 3D scan of your venue? Link your Matterport, GeoCV, or other digital twin
        platform to integrate it directly into the Bona Parks ecosystem.
      </p>
      <div className="mt-10 max-w-2xl">
        <MatterportIntegration />
      </div>
    </section>

    <section id="rfp-upload" className="mt-24">
      <Eyebrow>Request for proposal</Eyebrow>
      <h2 className={`mt-5 ${sectionTitle}`}>Send us your brief</h2>
      <p className={sectionIntro}>
        Have a project in mind? Securely upload your RFP document. Our solutions architects will
        review it and respond within 48 business hours.
      </p>
      <div className="mt-10 max-w-2xl">
        <RfpUpload />
      </div>
    </section>

    <section id="contact-us" className="mt-24">
      <Eyebrow>Contact</Eyebrow>
      <h2 className={`mt-5 ${sectionTitle}`}>Talk to our team</h2>
      <p className={sectionIntro}>
        Have a general inquiry or need more information? Fill out the form below and our
        partnership team will get in touch.
      </p>
      <div className="mt-10 max-w-2xl">
        <ContactForm />
      </div>
    </section>
  </PageShell>
);

export default B2BHubPage;
