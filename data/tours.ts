import { ExperienceItem } from '../types';

/**
 * Single source of truth for every Matterport tour shown on the site.
 * Add a tour here and it appears on the home page and in the gallery.
 *
 * `id` is the Matterport model id (the `m=` value in the share link).
 */
export interface Tour {
  id: string;
  title: string;
  category: string;
  description: string;
  /** Optional override for the card image; defaults to the Matterport thumbnail. */
  imageUrl?: string;
  metrics?: { label: string; value: string }[];
}

export const tours: Tour[] = [
  {
    id: '9QowmxAGxxm',
    title: 'Cultural Places',
    category: 'Heritage',
    description:
      'A walkthrough of Sardinian cultural heritage, captured in high resolution so every detail of the space stays explorable from anywhere.',
  },
  {
    id: '9LN7ivtu7Jq',
    title: 'Real Estate',
    category: 'Property',
    description:
      'A property captured room by room, so buyers and tenants can walk the whole place from a single link before booking a visit.',
  },
  {
    id: '3bT4B1o3wp2',
    title: '170 NE 79th St',
    category: 'Property',
    description:
      'A full walkthrough of the address, floor by floor, with every room measurable and open to visitors from any device.',
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

/** Adapts a Tour to the ExperienceItem shape the shared components consume. */
export const toExperienceItem = (tour: Tour): ExperienceItem => ({
  title: tour.title,
  category: tour.category,
  description: tour.description,
  imageUrl: tour.imageUrl ?? tourThumbUrl(tour.id),
  matterportUrl: tourShareUrl(tour.id),
  metrics: tour.metrics,
});

export const tourItems: ExperienceItem[] = tours.map(toExperienceItem);
