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
  description: string;
  subscriberPHIDs: string[];
  projectPHIDs: string[];
  points: number;
  subscribers: number;
  detectedLanguage?: string;
  gerritUrl?: string;
  tags: string[];
  phabricatorUrl: string;
  createdAt: string;
  difficulty: Difficulty;
}

export type Difficulty = "Easy" | "Medium" | "Hard";
export const difficulties: Difficulty[] = ["Easy", "Medium", "Hard"];

export type Language = "JavaScript" | "Python" | "Lua" | "PHP" | "Java" | "Other" | "Unknown";
export const languages: Language[] = ["JavaScript", "Python", "Lua", "PHP", "Java", "Other", "Unknown"];

export type TaskQuery = 'good-first' | 'bot-dev' | 'core' | 'gadgets' | 'web-tools';

export interface ProjectTag {
  phid: string;
  name: string;
}

export interface Filters {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  projectPHIDs: string[];
  maxSubscribers: number;
  openOnly: boolean;
  query: TaskQuery | null;
  text?: string;
}

export type SortOption = 'dateCreated' | 'subscribers' | 'difficulty';
