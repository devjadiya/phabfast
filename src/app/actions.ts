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

const PHABRICATOR_API_URL = process.env.PHABRICATOR_API_URL;
const PHABRICATOR_API_TOKEN = process.env.PHABRICATOR_API_TOKEN;

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


export async function getTasks(filters: Filters): Promise<Task[]> {
  
  const constraints: any = {
    statuses: filters.openOnly ? ['open'] : undefined,
  };

  const queryParts: string[] = [];
  if (filters.query) {
    if (filters.query === 'good-first') {
      queryParts.push('"good first task"');
    } else if (filters.query === 'bot-dev') {
      queryParts.push('bots');
    }
  }

  if (filters.languages.length > 0) {
    queryParts.push(...filters.languages);
  }

  if (filters.difficulties.length > 0) {
    queryParts.push(...filters.difficulties)
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

  if (filters.dateRange.from && filters.dateRange.to) {
    tasks = tasks.filter(task => {
      const taskDate = fromUnixTime(task.dateCreated);
      return isWithinInterval(taskDate, { start: filters.dateRange.from!, end: filters.dateRange.to! });
    });
  }
  
  tasks = tasks.filter(task => task.subscribers <= filters.maxSubscribers);

  // Language detection using Genkit flow
  const tasksWithLanguage = await Promise.all(
    tasks.map(async (task) => {
      try {
        const result = await detectTaskLanguage({ description: task.description });
        return { ...task, detectedLanguage: result.language };
      } catch (error) {
        console.error(`Failed to detect language for task ${task.id}:`, error);
        return { ...task, detectedLanguage: "Unknown" }; // Fallback
      }
    })
  );

  return tasksWithLanguage.sort((a, b) => b.dateCreated - a.dateCreated);
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
