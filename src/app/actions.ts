"use server";

import { parse, isWithinInterval } from "date-fns";
import type { Filters, Task, Language, Difficulty } from "@/lib/types";
import { mockTasks } from "@/lib/mock-data";
import { detectTaskLanguage } from "@/ai/flows/detect-task-language";

export async function getTasks(filters: Filters): Promise<Task[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const { dateRange, languages, maxSubscribers, difficulties, openOnly, query } = filters;

  let filteredTasks = mockTasks;

  if (query) {
    if (query === 'good-first') {
      filteredTasks = filteredTasks.filter(task => task.tags.includes('good first task'));
    } else if (query === 'bot-dev') {
      filteredTasks = filteredTasks.filter(task => task.tags.includes('bots') || task.title.toLowerCase().includes('bot'));
    }
  }

  if (dateRange.from && dateRange.to) {
    filteredTasks = filteredTasks.filter(task => {
      const taskDate = parse(task.createdAt, "yyyy-MM-dd", new Date());
      return isWithinInterval(taskDate, { start: dateRange.from!, end: dateRange.to! });
    });
  }

  if (languages.length > 0) {
    const lowerCaseLangs = languages.map(l => l.toLowerCase());
    filteredTasks = filteredTasks.filter(task =>
      task.tags.some(tag => lowerCaseLangs.includes(tag.toLowerCase()))
    );
  }

  filteredTasks = filteredTasks.filter(task => task.subscribers <= maxSubscribers);

  if (difficulties.length > 0) {
    const lowerCaseDiffs = difficulties.map(d => d.toLowerCase());
    filteredTasks = filteredTasks.filter(task =>
      task.tags.some(tag => lowerCaseDiffs.includes(tag.toLowerCase()))
    );
  }

  // Language detection using Genkit flow
  const tasksWithLanguage = await Promise.all(
    filteredTasks.map(async (task) => {
      try {
        const result = await detectTaskLanguage({ description: task.description });
        return { ...task, detectedLanguage: result.language };
      } catch (error) {
        console.error(`Failed to detect language for task ${task.id}:`, error);
        return { ...task, detectedLanguage: "Unknown" }; // Fallback
      }
    })
  );

  return tasksWithLanguage.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
