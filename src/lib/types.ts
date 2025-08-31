export interface Task {
  id: number;
  phid: string;
  title: string;
  uri: string;
  authorPHID: string;
  ownerPHID: string;
  status: string;
  statusName: string;
  isClosed: boolean;
  dateCreated: number;
  dateModified: number;
  description: string; // This is a custom field for the description
  subscriberPHIDs: string[]; // Custom field for subscribers
  projectPHIDs: string[]; // Custom field for projects/tags
  points: number;
  subscribers: number;
  detectedLanguage?: string;
  gerritUrl?: string; // This is not from phabricator, might need custom logic
  tags: string[];
  phabricatorUrl: string;
  createdAt: string;
}

export type Difficulty = "Easy" | "Medium" | "Hard";
export const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

export type Language = "JavaScript" | "Python" | "Lua" | "PHP" | "Other";
export const languages: Language[] = ["JavaScript", "Python", "Lua", "PHP", "Other"];

export type TaskQuery = 'good-first' | 'bot-dev';

export interface Filters {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  languages: Language[];
  maxSubscribers: number;
  difficulties: Difficulty[];
  openOnly: boolean;
  query: TaskQuery | null;
}
