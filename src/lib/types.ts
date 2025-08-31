export interface Task {
  id: string;
  title: string;
  createdAt: string;
  tags: string[];
  subscribers: number;
  description: string;
  phabricatorUrl: string;
  gerritUrl?: string;
  detectedLanguage?: string;
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
