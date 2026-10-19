/**
 * Every user-visible string of the site, in English and French.
 * `fr` is typed as `Dictionary`, so TypeScript refuses a key missing in either language.
 * Tour titles and descriptions live next to the tours in data/tours.ts.
 */

export type Lang = 'fr' | 'en';

const en = {
  meta: {
    title: 'Bona Parks — Immersive 3D Tours',
    description:
      'Bona Parks builds high-resolution digital twins and immersive 3D virtual tours of venues, real estate and cultural heritage in Sardinia.',
  },
  nav: {
    tours: 'Tours',
    gallery: 'Gallery',
    venues: 'Venues',
    technology: 'Technology',
    business: 'For business',
    main: 'Main',
    mainMobile: 'Main mobile',
    toggle: 'Toggle navigation',
    backHome: 'Back to home',
    language: 'Language',
  },
  theme: {
    group: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
  },
  footer: {
    tagline:
      'Immersive 3D tours and digital twins of the places that deserve to be walked through, from anywhere.',
    explore: 'Explore',
    contact: 'Get in touch',
    location: 'Sardinia, Italy',
    app: 'Bonaparks app',
    appPrivacy: 'Privacy',
    appPrivacyHref: '/en/privacy',
    appSupport: 'Support',
    appSupportHref: '/en/support',
    rights: 'All rights reserved.',
    label: 'Footer',
  },
  cookies: {
    text: 'We use cookies to enhance your experience, analyze site traffic, and personalize content.',
    accept: 'Accept',
    decline: 'Decline',
  },
  tourCard: {
    enter: 'Enter the tour',
  },
  viewer: {
    fullScreen: 'Open full screen',
    closeLabel: 'Close viewer',
    close: 'Close',
    loading: 'Loading the tour',
    iframeTitle: (title: string) => `3D tour of ${title}`,
    noTour: 'This space has no 3D tour published yet.',
    hint: 'Drag to look around · Scroll to zoom · Esc to close',
  },
  home: {
    eyebrow: 'Immersive 3D tours · Sardinia',
    title: 'Walk through the place before you ever get there.',
    intro:
      'Bona Parks turns real spaces into high-resolution virtual tours. Venues, homes and cultural heritage, captured in 3D and open to anyone with a link.',
    seeGallery: 'See the gallery',
    getScanned: 'Get your space scanned',
    featured: 'Featured tour',
    collectionEyebrow: 'The collection',
    collectionTitle: 'Spaces you can step into',
    collectionIntro: 'Every tour below is a real 3D capture. Move freely, look up, measure, explore.',
    empty: 'New tours are being published shortly.',
    howEyebrow: 'How it works',
    steps: [
      {
        title: 'Scan',
        body: 'We capture the space with millimetre-accurate 3D scanning — every room, every surface, in one pass.',
      },
      {
        title: 'Build',
        body: 'The scan becomes a navigable digital twin: measurable, annotated, and ready to embed anywhere.',
      },
      {
        title: 'Share',
        body: 'One link puts your venue in front of anyone, on any device, with no app to install.',
      },
    ],
    ctaTitle: 'Turn your space into an experience.',
    ctaBody:
      'Real estate, venues, museums or hotels — if people need to see it, we can let them walk through it.',
    ctaButton: 'Start your project',
  },
  venues: {
    eyebrow: 'Immersive venues',
    title: 'Places built to be visited, not just looked at',
    intro:
      'High-fidelity interactive replicas of real and imagined spaces. Step inside and explore at your own pace.',
    action: 'Explore in VR/AR',
    items: [
      {
        category: 'Nightclub',
        description:
          'A multi-level virtual space scanned with millimeter accuracy, hosting weekly DJ sets and social events.',
      },
      {
        category: 'Lounge',
        description:
          'A retro-futuristic hub for meeting friends, featuring interactive games and personalized ambient music.',
      },
      {
        category: 'Museum',
        description:
          'An ethereal, nature-infused gallery where digital exhibits come to life, providing an unforgettable educational journey.',
      },
    ],
  },
  gallery: {
    eyebrow: 'Gallery',
    title: 'Every space we have captured',
    intro:
      'A complete archive of our 3D captures. Open any one of them and explore it as if you were standing inside.',
    empty: 'No tours published yet.',
    ctaTitle: 'Your space belongs in here.',
    ctaBody: 'Tell us what you want to show and we will handle the capture, the editing and the hosting.',
    ctaButton: 'Book a scan',
  },
  technology: {
    eyebrow: 'Technology',
    title: 'The tech behind the tour',
    intro:
      'Precision capture on one side, artificial intelligence on the other. Together they make a virtual space feel less like a photo and more like a visit.',
    solutions: [
      {
        title: 'Millimetre capture',
        description:
          'Laser and photogrammetric scanning produce a dimensionally accurate model, not a stitched panorama. Measure anything, from anywhere.',
      },
      {
        title: 'Dynamic NPCs',
        description:
          'Our characters and guides are powered by advanced AI, allowing for natural conversations and unique interactions.',
      },
      {
        title: 'Personalized experiences',
        description:
          'Our platform learns your preferences to recommend events, venues, and art that you will love.',
      },
      {
        title: 'Interactive worlds',
        description:
          'From AI-generated art to responsive environments, our tech creates a living world that reacts to you.',
      },
    ],
    ctaTitle: 'Curious how this fits your venue?',
    ctaBody: 'The Business Studio walks you through the live demos and lets you send us a brief.',
    ctaButton: 'Open Business Studio',
  },
  business: {
    eyebrow: 'For business',
    intro:
      'Explore our enterprise solutions and partner with us to build the future of digital interaction.',
    demosEyebrow: 'Interactive demos',
    demosTitle: 'See the technology work',
    demosIntro: 'Experience the power of our AI and simulation technology firsthand.',
    demoNpc: 'Dynamic NPCs',
    demoPersonalization: 'Personalized experiences',
    demoWorld: 'Interactive worlds',
    npcGreeting: 'Hello! Ask me about our capabilities.',
    npcQuestions: [
      {
        q: 'What is your latency?',
        a: 'Our AI is optimized for real-time interaction, with response times under 200ms.',
      },
      {
        q: 'Can you be customized?',
        a: 'Absolutely. My personality, knowledge base, and appearance are fully customizable to fit your brand.',
      },
      {
        q: 'Do you support multiple languages?',
        a: 'Yes, I can be configured to interact in over 50 languages.',
      },
    ],
    tags: { Music: 'Music', Art: 'Art', Social: 'Social', Gaming: 'Gaming' },
    events: { dj: 'Live DJ Set', art: 'Art Gallery Opening', escape: 'VR Escape Room' },
    recommended: 'Rec',
    hotspotDj: 'Interactive DJ booth',
    hotspotVisuals: 'Player-triggered visuals',
    integrationEyebrow: 'Integration',
    integrationTitle: 'Integrate your digital twin',
    integrationIntro:
      'Already have a 3D scan of your venue? Link your Matterport, GeoCV, or other digital twin platform to integrate it directly into the Bona Parks ecosystem.',
    scanUrlLabel: '3D scan public URL',
    scanVerifying: 'Verifying link...',
    scanSubmit: 'Submit for integration',
    scanDoneTitle: 'Scan link submitted',
    scanDoneBody: 'We received your link and will get back to you by email.',
    scanDoneAction: 'Submit another link',
    rfpEyebrow: 'Request for proposal',
    rfpTitle: 'Send us your brief',
    rfpIntro:
      'Have a project in mind? Securely upload your RFP document. Our solutions architects will review it and respond within 48 business hours.',
    rfpClick: 'Click to upload',
    rfpDrag: 'or drag and drop',
    rfpFormats: 'PDF, DOC or DOCX · max 8MB',
    rfpTooLarge: 'File size cannot exceed 8MB.',
    rfpBadType: 'Invalid file type. Please upload PDF or DOCX.',
    megabytes: 'MB',
    remove: (name: string) => `Remove ${name}`,
    rfpSubmitting: 'Submitting...',
    rfpSubmit: 'Submit securely',
    rfpDoneTitle: 'RFP submitted',
    rfpDoneBody: 'Our team will review your document and be in touch shortly.',
    rfpDoneAction: 'Submit another RFP',
    contactEyebrow: 'Contact',
    contactTitle: 'Talk to our team',
    contactIntro:
      'Have a general inquiry or need more information? Fill out the form below and our partnership team will get in touch.',
    fullName: 'Full name',
    company: 'Company',
    email: 'Email address',
    message: 'Message',
    send: 'Send message',
    replyEmail: 'Your email address',
    sendError: 'Sending failed. Please try again or write to bonaparks@icloud.com.',
    sentTitle: 'Message sent',
    sentBody: 'Thank you. We will get back to you soon.',
    sentAction: 'Send another message',
  },
};

export type Dictionary = typeof en;

const fr: Dictionary = {
  meta: {
    title: 'Bona Parks — Visites 3D immersives',
    description:
      'Bona Parks réalise des jumeaux numériques haute résolution et des visites virtuelles 3D immersives de lieux, de biens immobiliers et du patrimoine culturel en Sardaigne.',
  },
  nav: {
    tours: 'Visites',
    gallery: 'Galerie',
    venues: 'Lieux',
    technology: 'Technologie',
    business: 'Entreprises',
    main: 'Principale',
    mainMobile: 'Principale mobile',
    toggle: 'Ouvrir ou fermer le menu',
    backHome: 'Retour à l’accueil',
    language: 'Langue',
  },
  theme: {
    group: 'Apparence',
    light: 'Clair',
    dark: 'Sombre',
    auto: 'Auto',
  },
  footer: {
    tagline:
      'Visites 3D immersives et jumeaux numériques des lieux qui méritent d’être parcourus, depuis n’importe où.',
    explore: 'Explorer',
    contact: 'Nous contacter',
    location: 'Sardaigne, Italie',
    app: 'App Bonaparks',
    appPrivacy: 'Confidentialité',
    appPrivacyHref: '/confidentialite',
    appSupport: 'Support',
    appSupportHref: '/support',
    rights: 'Tous droits réservés.',
    label: 'Pied de page',
  },
  cookies: {
    text: 'Nous utilisons des cookies pour améliorer votre expérience, analyser la fréquentation du site et personnaliser le contenu.',
    accept: 'Accepter',
    decline: 'Refuser',
  },
  tourCard: {
    enter: 'Entrer dans la visite',
  },
  viewer: {
    fullScreen: 'Ouvrir en plein écran',
    closeLabel: 'Fermer la visite',
    close: 'Fermer',
    loading: 'Chargement de la visite',
    iframeTitle: (title: string) => `Visite 3D : ${title}`,
    noTour: 'Aucune visite 3D n’est encore publiée pour ce lieu.',
    hint: 'Faites glisser pour regarder autour · Molette pour zoomer · Échap pour fermer',
  },
  home: {
    eyebrow: 'Visites 3D immersives · Sardaigne',
    title: 'Parcourez le lieu avant même d’y être.',
    intro:
      'Bona Parks transforme des espaces réels en visites virtuelles haute résolution. Lieux, logements et patrimoine culturel, capturés en 3D et accessibles à tous via un simple lien.',
    seeGallery: 'Voir la galerie',
    getScanned: 'Faire scanner votre espace',
    featured: 'Visite à la une',
    collectionEyebrow: 'La collection',
    collectionTitle: 'Des espaces où entrer',
    collectionIntro:
      'Chaque visite ci-dessous est une véritable capture 3D. Déplacez-vous librement, levez les yeux, mesurez, explorez.',
    empty: 'De nouvelles visites seront publiées très bientôt.',
    howEyebrow: 'Comment ça marche',
    steps: [
      {
        title: 'Scanner',
        body: 'Nous capturons l’espace par un scan 3D précis au millimètre : chaque pièce, chaque surface, en un seul passage.',
      },
      {
        title: 'Construire',
        body: 'Le scan devient un jumeau numérique navigable : mesurable, annoté et prêt à être intégré partout.',
      },
      {
        title: 'Partager',
        body: 'Un seul lien suffit pour montrer votre lieu à tous, sur n’importe quel appareil, sans application à installer.',
      },
    ],
    ctaTitle: 'Faites de votre espace une expérience.',
    ctaBody:
      'Immobilier, lieux, musées ou hôtels : si les gens ont besoin de le voir, nous pouvons le leur faire parcourir.',
    ctaButton: 'Lancer votre projet',
  },
  venues: {
    eyebrow: 'Lieux immersifs',
    title: 'Des lieux faits pour être visités, pas seulement regardés',
    intro:
      'Des répliques interactives haute fidélité d’espaces réels ou imaginaires. Entrez et explorez à votre rythme.',
    action: 'Explorer en VR/AR',
    items: [
      {
        category: 'Boîte de nuit',
        description:
          'Un espace virtuel sur plusieurs niveaux, scanné au millimètre près, qui accueille chaque semaine des DJ sets et des soirées.',
      },
      {
        category: 'Lounge',
        description:
          'Un lieu de rencontre rétro-futuriste pour retrouver ses amis, avec des jeux interactifs et une ambiance musicale personnalisée.',
      },
      {
        category: 'Musée',
        description:
          'Une galerie éthérée, inspirée de la nature, où les œuvres numériques prennent vie pour un parcours éducatif inoubliable.',
      },
    ],
  },
  gallery: {
    eyebrow: 'Galerie',
    title: 'Tous les espaces que nous avons capturés',
    intro:
      'L’archive complète de nos captures 3D. Ouvrez n’importe laquelle et explorez-la comme si vous y étiez.',
    empty: 'Aucune visite publiée pour le moment.',
    ctaTitle: 'Votre espace a sa place ici.',
    ctaBody:
      'Dites-nous ce que vous voulez montrer : nous nous occupons de la capture, du montage et de l’hébergement.',
    ctaButton: 'Réserver un scan',
  },
  technology: {
    eyebrow: 'Technologie',
    title: 'La technologie derrière la visite',
    intro:
      'D’un côté la capture de précision, de l’autre l’intelligence artificielle. Ensemble, elles font d’un espace virtuel moins une photo qu’une véritable visite.',
    solutions: [
      {
        title: 'Capture au millimètre',
        description:
          'Le scan laser et photogrammétrique produit un modèle aux dimensions exactes, pas un panorama assemblé. Mesurez tout, depuis n’importe où.',
      },
      {
        title: 'PNJ dynamiques',
        description:
          'Nos personnages et nos guides sont animés par une IA avancée, pour des conversations naturelles et des interactions uniques.',
      },
      {
        title: 'Expériences personnalisées',
        description:
          'Notre plateforme apprend vos préférences pour vous recommander des événements, des lieux et des œuvres que vous allez aimer.',
      },
      {
        title: 'Mondes interactifs',
        description:
          'De l’art généré par IA aux environnements réactifs, notre technologie crée un monde vivant qui réagit à vous.',
      },
    ],
    ctaTitle: 'Curieux de voir ce que cela donnerait pour votre lieu ?',
    ctaBody:
      'Le Business Studio vous présente les démos en direct et vous permet de nous envoyer votre cahier des charges.',
    ctaButton: 'Ouvrir le Business Studio',
  },
  business: {
    eyebrow: 'Entreprises',
    intro:
      'Découvrez nos solutions pour les entreprises et construisez avec nous l’avenir de l’interaction numérique.',
    demosEyebrow: 'Démos interactives',
    demosTitle: 'La technologie en action',
    demosIntro: 'Découvrez par vous-même la puissance de notre IA et de nos technologies de simulation.',
    demoNpc: 'PNJ dynamiques',
    demoPersonalization: 'Expériences personnalisées',
    demoWorld: 'Mondes interactifs',
    npcGreeting: 'Bonjour ! Posez-moi vos questions sur nos capacités.',
    npcQuestions: [
      {
        q: 'Quelle est votre latence ?',
        a: 'Notre IA est optimisée pour l’interaction en temps réel, avec des temps de réponse inférieurs à 200 ms.',
      },
      {
        q: 'Peut-on vous personnaliser ?',
        a: 'Absolument. Ma personnalité, ma base de connaissances et mon apparence sont entièrement personnalisables pour s’accorder à votre marque.',
      },
      {
        q: 'Parlez-vous plusieurs langues ?',
        a: 'Oui, je peux être configuré pour échanger dans plus de 50 langues.',
      },
    ],
    tags: { Music: 'Musique', Art: 'Art', Social: 'Social', Gaming: 'Jeux' },
    events: { dj: 'DJ set en live', art: 'Vernissage de galerie', escape: 'Escape game en VR' },
    recommended: 'Reco',
    hotspotDj: 'Cabine DJ interactive',
    hotspotVisuals: 'Visuels déclenchés par le joueur',
    integrationEyebrow: 'Intégration',
    integrationTitle: 'Intégrez votre jumeau numérique',
    integrationIntro:
      'Vous avez déjà un scan 3D de votre lieu ? Associez votre Matterport, GeoCV ou toute autre plateforme de jumeau numérique pour l’intégrer directement à l’écosystème Bona Parks.',
    scanUrlLabel: 'URL publique du scan 3D',
    scanVerifying: 'Vérification du lien...',
    scanSubmit: 'Envoyer pour intégration',
    scanDoneTitle: 'Lien du scan envoyé',
    scanDoneBody: 'Nous avons bien reçu votre lien et vous répondrons par e-mail.',
    scanDoneAction: 'Envoyer un autre lien',
    rfpEyebrow: 'Appel d’offres',
    rfpTitle: 'Envoyez-nous votre cahier des charges',
    rfpIntro:
      'Vous avez un projet en tête ? Déposez votre cahier des charges en toute sécurité. Nos architectes solutions l’étudieront et vous répondront sous 48 heures ouvrées.',
    rfpClick: 'Cliquez pour déposer',
    rfpDrag: 'ou glissez-déposez',
    rfpFormats: 'PDF, DOC ou DOCX · 8 Mo max.',
    rfpTooLarge: 'Le fichier ne peut pas dépasser 8 Mo.',
    rfpBadType: 'Type de fichier non valide. Veuillez déposer un PDF ou un DOCX.',
    megabytes: 'Mo',
    remove: (name: string) => `Retirer ${name}`,
    rfpSubmitting: 'Envoi...',
    rfpSubmit: 'Envoyer en toute sécurité',
    rfpDoneTitle: 'Cahier des charges envoyé',
    rfpDoneBody: 'Notre équipe va étudier votre document et vous recontactera rapidement.',
    rfpDoneAction: 'Envoyer un autre document',
    contactEyebrow: 'Contact',
    contactTitle: 'Parlez à notre équipe',
    contactIntro:
      'Une question générale ou besoin de plus d’informations ? Remplissez le formulaire ci-dessous et notre équipe partenariats vous recontactera.',
    fullName: 'Nom complet',
    company: 'Entreprise',
    email: 'Adresse e-mail',
    message: 'Message',
    send: 'Envoyer le message',
    replyEmail: 'Votre adresse e-mail',
    sendError: 'L’envoi a échoué. Réessayez ou écrivez à bonaparks@icloud.com.',
    sentTitle: 'Message envoyé',
    sentBody: 'Merci. Nous vous répondrons très bientôt.',
    sentAction: 'Envoyer un autre message',
  },
};

export const dictionaries: Record<Lang, Dictionary> = { en, fr };
