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
  imageUrl?: string;
  imagePrompt?: string;
}

export interface ExperienceItem {
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    metrics?: { label: string; value: string }[];
    matterportUrl?: string;
}

// FIX: Define and export BookableItem and Booking interfaces to resolve import errors.
export interface BookableItem {
  title: string;
  description: string;
  imageUrl: string;
  price: number;
}

export interface Booking {
  id: string;
  title: string;
  status: 'Active' | 'Redeemed' | 'Pending';
  lastUpdate: string;
  imageUrl: string;
  description: string;
  type: 'Nightclub' | 'Exhibition';
  bookingDate: string;
}

export interface Project {
  id:string;
  title: string;
  status: 'In Progress' | 'Completed' | 'On Hold';
  lastUpdate: string;
  description: string;
  type: 'Automation' | 'Creative' | 'Marketing';
}