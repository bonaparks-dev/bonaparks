
export enum Sender {
  User = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  isError?: boolean;
  originalText?: string;
}

export interface ExperienceItem {
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    metrics?: { label: string; value: string }[];
}

export interface Booking {
  id: string;
  title: string;
  status: 'Active' | 'Redeemed' | 'Pending';
  lastUpdate: string;
  imageUrl: string;
  description: string;
  // FIX: Add type and bookingDate to support BookingsPage component
  type: 'Nightclub' | 'Exhibition';
  bookingDate: string;
}

// FIX: Define and export BookableItem and Booking interfaces to resolve import errors.
export interface BookableItem {
  title: string;
  description: string;
  imageUrl: string;
  price: number;
}
