import { ExperienceItem } from '../types';
import type { Lang } from '../i18n/dictionary';

/** A text shown on the site, in both languages. */
export type Localized = Record<Lang, string>;

/**
 * Single source of truth for every Matterport tour shown on the site.
 * Add a tour here and it appears on the home page and in the gallery.
 * Titles, categories and descriptions are given in English and French.
 *
 * `id` is the Matterport model id (the `m=` value in the share link).
 */
export interface Tour {
  id: string;
  title: Localized;
  category: Localized;
  description: Localized;
  /** Optional override for the card image; defaults to the Matterport thumbnail. */
  imageUrl?: string;
  metrics?: { label: string; value: string }[];
}

export const tours: Tour[] = [
  {
    id: '9QowmxAGxxm',
    title: { en: 'Cultural Places', fr: 'Lieux culturels' },
    category: { en: 'Heritage', fr: 'Patrimoine' },
    description: {
      en: 'A walkthrough of Sardinian cultural heritage, captured in high resolution so every detail of the space stays explorable from anywhere.',
      fr: 'Une visite du patrimoine culturel sarde, capturé en haute résolution pour que chaque détail du lieu reste explorable depuis n’importe où.',
    },
  },
  {
    id: '9LN7ivtu7Jq',
    title: { en: 'Real Estate', fr: 'Immobilier' },
    category: { en: 'Property', fr: 'Immobilier' },
    description: {
      en: 'A property captured room by room, so buyers and tenants can walk the whole place from a single link before booking a visit.',
      fr: 'Un bien capturé pièce par pièce, pour que les acheteurs et les locataires puissent le parcourir en entier depuis un simple lien avant de réserver une visite.',
    },
  },
  {
    id: '3bT4B1o3wp2',
    title: { en: '170 NE 79th St', fr: '170 NE 79th St' },
    category: { en: 'Property', fr: 'Immobilier' },
    description: {
      en: 'A full walkthrough of the address, floor by floor, with every room measurable and open to visitors from any device.',
      fr: 'Une visite complète de l’adresse, étage par étage, avec chaque pièce mesurable et accessible depuis n’importe quel appareil.',
    },
  },
];

/** Matterport auto-generated thumbnail for a model. */
export const tourThumbUrl = (id: string) =>
  `https://my.matterport.com/api/v1/player/models/${id}/thumb`;

/** Public share link (opens the tour on matterport.com). */
export const tourShareUrl = (id: string) =>
  `https://my.matterport.com/show/?m=${id}`;

/** Embeddable player URL used inside the immersive viewer iframe. */
export const tourEmbedUrl = (id: string, autoplay = true) =>
  `https://my.matterport.com/show/?m=${id}&play=${autoplay ? 1 : 0}&qs=1&brand=0`;

/** Adapts a Tour to the ExperienceItem shape the shared components consume, in one language. */
export const toExperienceItem = (tour: Tour, lang: Lang): ExperienceItem => ({
  title: tour.title[lang],
  category: tour.category[lang],
  description: tour.description[lang],
  imageUrl: tour.imageUrl ?? tourThumbUrl(tour.id),
  matterportUrl: tourShareUrl(tour.id),
  metrics: tour.metrics,
});

/** Every tour as ExperienceItems, in the given language. */
export const tourItemsFor = (lang: Lang): ExperienceItem[] =>
  tours.map((tour) => toExperienceItem(tour, lang));
