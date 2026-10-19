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

export interface Project {
  id:string;
  title: string;
  status: 'In Progress' | 'Completed' | 'On Hold';
  lastUpdate: string;
  description: string;
  type: 'Automation' | 'Creative' | 'Marketing';
}