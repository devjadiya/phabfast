"use server";

import { parse, isWithinInterval, fromUnixTime } from "date-fns";
import type { Filters, Task, Language, Difficulty } from "@/lib/types";
import { detectTaskLanguage } from "@/ai/flows/detect-task-language";
import axios from 'axios';

interface PhabricatorTask {
  id: number;
  phid: string;
  fields: {
    name: string;
    description: {
      raw: string;
    };
    authorPHID: string;
    ownerPHID: string;
    status: {
      value: string;
      name: string;
    };
    isClosed: boolean;
    dateCreated: number;
    dateModified: number;
    points: number;
    subscriberPHIDs?: string[];
    projectPHIDs?: string[];
  };
  attachments: {
    projects?: {
      projectPHIDs: string[];
      tags: { [key: string]: string };
    },
    subscribers?: {
      subscriberPHIDs: string[];
      subscriberCount: number;
    }
  }
}

interface GerritChange {
  id: string;
  project: string;
  branch: string;
  change_id: string;
  subject: string;
  status: string;
  created: string;
  updated: string;
  _number: number;
}


const PHABRICATOR_API_URL = process.env.PHABRICATOR_API_URL;
const PHABRICATOR_API_TOKEN = process.env.PHABRICATOR_API_TOKEN;
const GERRIT_API_URL = process.env.GERRIT_API_URL;

async function fetchPhabricatorTasks(constraints: object = {}, attachments: object = {}): Promise<PhabricatorTask[]> {
  if (!PHABRICATOR_API_URL || !PHABRICATOR_API_TOKEN) {
    console.error("Phabricator API URL or Token not set in .env");
    return [];
  }

  try {
    const response = await axios.post(
      `${PHABRICATOR_API_URL}/maniphest.search`,
      new URLSearchParams({
        'api.token': PHABRICATOR_API_TOKEN,
        ...Object.fromEntries(Object.entries(constraints).map(([k, v]) => [`constraints[${k}]`, v])),
        ...Object.fromEntries(Object.entries(attachments).map(([k, v]) => [`attachments[${k}]`, v])),
      })
    );
    
    if (response.data.error_code) {
      console.error('Phabricator API Error:', response.data.error_info);
      return [];
    }

    return response.data.result.data;
  } catch (error) {
    console.error('Failed to fetch tasks from Phabricator:', error);
    return [];
  }
}

async function fetchGerritPatch(taskId: number): Promise<string | undefined> {
  if (!GERRIT_API_URL) {
    return undefined;
  }
  try {
    // Gerrit API returns a JSON array prefixed with )]}'
    const response = await axios.get(`${GERRIT_API_URL}/changes/?q=topic:T${taskId}&n=1`);
    const sanitizedJSON = response.data.replace(")]}'", "");
    const changes: GerritChange[] = JSON.parse(sanitizedJSON);
    
    if (changes.length > 0) {
      return `${GERRIT_API_URL}/c/${changes[0]._number}`;
    }
  } catch (error) {
    // Not all tasks will have patches, so we can often ignore errors
    // console.error(`Failed to fetch Gerrit patch for task ${taskId}:`, error);
  }
  return undefined;
}


export async function getTasks(filters: Filters): Promise<Task[]> {
  
  const constraints: any = {};
   if (filters.openOnly) {
    constraints.statuses = ['open'];
  }

  const queryParts: string[] = [];
  if (filters.query) {
    if (filters.query === 'good-first') {
      queryParts.push('"good first task"');
    } else if (filters.query === 'bot-dev') {
      queryParts.push('bots OR automation');
    }
  }
  
  // This part of the original query was flawed.
  // We can't query by a language that hasn't been detected yet.
  // This is handled later in the client-side filtering section.
  // if (filters.languages.length > 0) {
  //   queryParts.push(...filters.languages.filter(l => l !== 'Other'));
  // }

  if (filters.difficulties.length > 0) {
    queryParts.push(...filters.difficulties.map(d => d.toLowerCase()));
  }
  
  if (queryParts.length > 0) {
    constraints.query = queryParts.join(' OR ');
  }

  const attachments = {
    projects: 1,
    subscribers: 1,
  };

  const phabTasks = await fetchPhabricatorTasks(constraints, attachments);

  let tasks: Task[] = phabTasks.map((phabTask: PhabricatorTask) => ({
      id: phabTask.id,
      phid: phabTask.phid,
      title: phabTask.fields.name,
      uri: `${process.env.PHABRICATOR_API_URL?.replace('/api', '')}/T${phabTask.id}`,
      authorPHID: phabTask.fields.authorPHID,
      ownerPHID: phabTask.fields.ownerPHID,
      status: phabTask.fields.status.value,
      statusName: phabTask.fields.status.name,
      isClosed: phabTask.fields.isClosed,
      dateCreated: phabTask.fields.dateCreated,
      dateModified: phabTask.fields.dateModified,
      description: phabTask.fields.description.raw,
      subscriberPHIDs: phabTask.attachments.subscribers?.subscriberPHIDs || [],
      projectPHIDs: phabTask.attachments.projects?.projectPHIDs || [],
      points: phabTask.fields.points || 0,
      subscribers: phabTask.attachments.subscribers?.subscriberCount || 0,
      tags: Object.values(phabTask.attachments.projects?.tags || {}),
      phabricatorUrl: `${process.env.PHABRICATOR_API_URL?.replace('/api', '')}/T${phabTask.id}`,
      createdAt: fromUnixTime(phabTask.fields.dateCreated).toISOString().split('T')[0],
  }));

  // Server-side filtering because Phabricator API has limitations
  
  if (filters.dateRange.from && filters.dateRange.to) {
    tasks = tasks.filter(task => {
      const taskDate = fromUnixTime(task.dateCreated);
      return isWithinInterval(taskDate, { start: filters.dateRange.from!, end: filters.dateRange.to! });
    });
  }
  
  if (filters.query === 'good-first') {
    tasks = tasks.filter(task => task.subscribers <= 3);
  } else if(filters.query !== 'bot-dev') { // 'bot-dev' might have many subscribers, so we don't filter it
    tasks = tasks.filter(task => task.subscribers <= filters.maxSubscribers);
  }

  // Language detection and Gerrit patch fetching
  const enrichedTasks = await Promise.all(
    tasks.map(async (task) => {
      let detectedLanguage = "Unknown";
      let gerritUrl: string | undefined;

      try {
        const [langResult, gerritResult] = await Promise.all([
          detectTaskLanguage({ description: `${task.title} ${task.description}` }),
          fetchGerritPatch(task.id),
        ]);
        
        detectedLanguage = langResult.language;
        gerritUrl = gerritResult;

      } catch (error) {
        console.error(`Failed to enrich task ${task.id}:`, error);
      }

      return { ...task, detectedLanguage, gerritUrl };
    })
  );

  let finalTasks = enrichedTasks;
  
  // Now we filter by language, after it has been detected.
  if (filters.languages.length > 0 && !filters.languages.includes('Other')) {
    finalTasks = finalTasks.filter(task => 
      filters.languages.some(lang => task.detectedLanguage?.toLowerCase().includes(lang.toLowerCase()))
    );
  }
  if (filters.languages.includes('Other')) {
    const knownLanguages = ["javascript", "python", "lua", "php"];
    finalTasks = finalTasks.filter(task => 
      !knownLanguages.some(lang => task.detectedLanguage?.toLowerCase().includes(lang))
    );
  }

  return finalTasks.sort((a, b) => b.dateCreated - a.dateCreated);
}

export async function exportTasks(tasks: Task[], format: "csv" | "md"): Promise<string> {
  if (format === "csv") {
    const header = "ID,Title,Created At,Subscribers,Language,Tags,URL\n";
    const rows = tasks.map(task =>
      `"${task.id}","${task.title}","${task.createdAt}","${task.subscribers}","${task.detectedLanguage}","${task.tags.join(', ')}","${task.phabricatorUrl}"`
    ).join("\n");
    return header + rows;
  }

  if (format === "md") {
    const header = "| ID | Title | Created At | Subs | Lang | URL |\n|----|-------|------------|------|------|-----|\n";
    const rows = tasks.map(task =>
      `| ${task.id} | ${task.title} | ${task.createdAt} | ${task.subscribers} | ${task.detectedLanguage} | [Link](${task.phabricatorUrl}) |`
    ).join("\n");
    return header + rows;
  }

  throw new Error("Unsupported format");
}
