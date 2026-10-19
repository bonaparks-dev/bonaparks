import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon, FileIcon, TrashIcon, AIIcon, CheckCircleIcon, LoadingIcon } from '../IconComponents';
import { Button, Eyebrow, Field, PageHeader, PageShell, Panel } from '../ui';
import { useLanguage } from '../../i18n/LanguageContext';

const sectionTitle = 'font-display text-3xl md:text-4xl text-bone';
const sectionIntro = 'mt-3 max-w-2xl text-sm leading-relaxed text-muted';
const textareaClasses =
  'w-full rounded-lg border border-line bg-ink px-4 py-3 text-bone placeholder-muted/60 transition-colors duration-300 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';

/** Green-tinted confirmation block shared by the three forms. */
const SuccessPanel: React.FC<{
  title: string;
  body: string;
  actionLabel: string;
  onReset: () => void;
}> = ({ title, body, actionLabel, onReset }) => (
  <Panel className="p-10 text-center">
    <div className="flex justify-center text-accent">
      <CheckCircleIcon />
    </div>
    <h4 className="mt-5 font-display text-2xl text-bone">{title}</h4>
    <p className="mt-3 text-sm text-muted">{body}</p>
    <button
      onClick={onReset}
      className="mt-6 text-xs font-semibold uppercase tracking-widest2 text-accent transition-colors hover:text-bone"
    >
      {actionLabel}
    </button>
  </Panel>
);

const NpcDemo: React.FC = () => {
  const { t } = useLanguage();
  /** Index of the question answered, or null for the greeting (so a language switch re-renders it). */
  const [answered, setAnswered] = useState<number | null>(null);
  const questions = t.business.npcQuestions;
  const npcResponse = answered === null ? t.business.npcGreeting : questions[answered].a;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-grow items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-ink">
          <AIIcon className="h-4 w-4 text-accent" />
        </div>
        <p className="rounded-lg border border-line bg-ink p-3 text-xs leading-relaxed text-muted">
          {npcResponse}
        </p>
      </div>
      <div className="mt-4 space-y-2">
        {questions.map(({ q: question }, index) => (
          <button
            key={index}
            onClick={() => setAnswered(index)}
            className="block w-full rounded-lg border border-line px-3 py-2 text-left text-xs text-muted transition-colors hover:border-accent/40 hover:text-bone"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

type DemoTag = 'Music' | 'Art' | 'Social' | 'Gaming';
const DEMO_TAGS: DemoTag[] = ['Music', 'Art', 'Social', 'Gaming'];

const PersonalizationDemo: React.FC = () => {
  const { t } = useLanguage();
  const allItems: { key: 'dj' | 'art' | 'escape'; tags: string[]; img: string }[] = [
    { key: 'dj', tags: ['Music', 'Social'], img: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
    { key: 'art', tags: ['Art', 'Culture'], img: 'https://images.pexels.com/photos/1578332/pexels-photo-1578332.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
    { key: 'escape', tags: ['Gaming', 'Social'], img: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' },
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
        {DEMO_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest2 transition-colors ${
              activeTags.has(tag)
                ? 'border-accent bg-accent text-on-accent'
                : 'border-line text-muted hover:text-bone'
            }`}
          >
            {t.business.tags[tag]}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {sortedItems.map((item) => {
          const isRecommended = item.tags.some((t) => activeTags.has(t)) && activeTags.size > 0;
          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 rounded-lg border p-2 transition-colors duration-300 ${
                isRecommended ? 'border-accent bg-ink' : 'border-line bg-ink'
              }`}
            >
              <img src={item.img} alt="" className="h-9 w-9 rounded object-cover" />
              <span className="text-xs text-muted">{t.business.events[item.key]}</span>
              {isRecommended && (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest2 text-accent">
                  {t.business.recommended}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InteractiveWorldDemo: React.FC = () => {
  const { t } = useLanguage();
  return (
  <div className="group relative h-full min-h-[220px] overflow-hidden rounded-lg border border-line">
    <img
      src="https://images.pexels.com/photos/2114365/pexels-photo-2114365.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
      alt=""
      className="h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-ink/50" aria-hidden="true" />
    <div className="absolute left-1/3 top-1/4 animate-pulse">
      <div className="h-3 w-3 cursor-pointer rounded-full bg-accent" />
      <div className="absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 rounded bg-ink px-2 py-1 text-[10px] text-bone group-hover:block">
        {t.business.hotspotDj}
      </div>
    </div>
    <div className="absolute bottom-1/4 right-1/4 animate-pulse" style={{ animationDelay: '0.5s' }}>
      <div className="h-3 w-3 cursor-pointer rounded-full bg-accent" />
      <div className="absolute bottom-full left-1/2 mb-2 hidden w-max -translate-x-1/2 rounded bg-ink px-2 py-1 text-[10px] text-bone group-hover:block">
        {t.business.hotspotVisuals}
      </div>
    </div>
  </div>
  );
};

const DemoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Panel className="flex flex-col">
    <div className="border-b border-line px-6 py-4">
      <h4 className="text-[11px] font-semibold uppercase tracking-widest2 text-accent">{title}</h4>
    </div>
    <div className="flex-grow p-6">{children}</div>
  </Panel>
);

const RfpUpload: React.FC = () => {
  const { lang, t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<'rfpTooLarge' | 'rfpBadType' | null>(null);
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
        setError('rfpTooLarge');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
        setError('rfpBadType');
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
        title={t.business.rfpDoneTitle}
        body={t.business.rfpDoneBody}
        actionLabel={t.business.rfpDoneAction}
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
          isDragging ? 'border-accent bg-accent/5' : 'border-line hover:border-accent/50'
        }`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
        <span className="text-muted">
          <UploadCloudIcon />
        </span>
        <p className="mt-2 text-sm text-muted">
          <span className="font-semibold text-accent">{t.business.rfpClick}</span> {t.business.rfpDrag}
        </p>
        <p className="text-xs text-muted">{t.business.rfpFormats}</p>
      </div>

      {error && <p className="mt-3 text-center text-xs text-accent">{t.business[error]}</p>}

      {file && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-ink p-3">
          <div className="flex items-center gap-3">
            <span className="text-muted">
              <FileIcon />
            </span>
            <div>
              <p className="text-sm text-bone">{file.name}</p>
              <p className="text-xs text-muted">{(file.size / 1024 / 1024).toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t.business.megabytes}</p>
            </div>
          </div>
          <button
            onClick={removeFile}
            className="text-muted transition-colors hover:text-accent"
            aria-label={t.business.remove(file.name)}
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
        <span>{uploadStatus === 'uploading' ? t.business.rfpSubmitting : t.business.rfpSubmit}</span>
      </Button>
    </Panel>
  );
};

const ContactForm: React.FC = () => {
  const { t } = useLanguage();
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
        title={t.business.sentTitle}
        body={t.business.sentBody}
        actionLabel={t.business.sentAction}
        onReset={() => setIsSubmitted(false)}
      />
    );
  }

  return (
    <Panel className="p-8 md:p-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field id="name" label={t.business.fullName} type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          <Field id="company" label={t.business.company} type="text" value={company} onChange={(e) => setCompany(e.target.value)} required />
        </div>
        <Field id="email" label={t.business.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div>
          <label htmlFor="message" className="mb-2 block text-xs font-semibold uppercase tracking-widest2 text-muted">
            {t.business.message}
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
          {t.business.send}
        </Button>
      </form>
    </Panel>
  );
};

const MatterportIntegration: React.FC = () => {
  const { t } = useLanguage();
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
        title={t.business.scanDoneTitle}
        body={t.business.scanDoneBody}
        actionLabel={t.business.scanDoneAction}
        onReset={() => setStatus('idle')}
      />
    );
  }

  return (
    <Panel className="p-8 md:p-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Field
          id="matterport-link"
          label={t.business.scanUrlLabel}
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          required
          placeholder="https://my.matterport.com/show/?m=XXXXXXXXXXX"
        />
        <Button type="submit" disabled={!link || status === 'submitting'} className="w-full">
          {status === 'submitting' && <LoadingIcon />}
          <span>{status === 'submitting' ? t.business.scanVerifying : t.business.scanSubmit}</span>
        </Button>
      </form>
    </Panel>
  );
};

const B2BHubPage: React.FC = () => {
  const { t } = useLanguage();
  return (
  <PageShell>
    <PageHeader
      eyebrow={t.business.eyebrow}
      title="Business Studio"
      intro={t.business.intro}
    />

    <section id="demos" className="mt-20">
      <Eyebrow>{t.business.demosEyebrow}</Eyebrow>
      <h2 className={`mt-5 ${sectionTitle}`}>{t.business.demosTitle}</h2>
      <p className={sectionIntro}>
        {t.business.demosIntro}
      </p>
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <DemoCard title={t.business.demoNpc}><NpcDemo /></DemoCard>
        <DemoCard title={t.business.demoPersonalization}><PersonalizationDemo /></DemoCard>
        <DemoCard title={t.business.demoWorld}><InteractiveWorldDemo /></DemoCard>
      </div>
    </section>

    <section id="integrate-scan" className="mt-24">
      <Eyebrow>{t.business.integrationEyebrow}</Eyebrow>
      <h2 className={`mt-5 ${sectionTitle}`}>{t.business.integrationTitle}</h2>
      <p className={sectionIntro}>
        {t.business.integrationIntro}
      </p>
      <div className="mt-10 max-w-2xl">
        <MatterportIntegration />
      </div>
    </section>

    <section id="rfp-upload" className="mt-24">
      <Eyebrow>{t.business.rfpEyebrow}</Eyebrow>
      <h2 className={`mt-5 ${sectionTitle}`}>{t.business.rfpTitle}</h2>
      <p className={sectionIntro}>
        {t.business.rfpIntro}
      </p>
      <div className="mt-10 max-w-2xl">
        <RfpUpload />
      </div>
    </section>

    <section id="contact-us" className="mt-24">
      <Eyebrow>{t.business.contactEyebrow}</Eyebrow>
      <h2 className={`mt-5 ${sectionTitle}`}>{t.business.contactTitle}</h2>
      <p className={sectionIntro}>
        {t.business.contactIntro}
      </p>
      <div className="mt-10 max-w-2xl">
        <ContactForm />
      </div>
    </section>
  </PageShell>
  );
};

export default B2BHubPage;
