import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';
import { detectTaskLanguage } from '@/ai/flows/detect-task-language';
import type { Filters, Task } from '@/lib/types';
import { fromUnixTime, isWithinInterval, parseISO } from 'date-fns';

export async function POST(req: Request) {
  try {
    const filters: Filters = await req.json();
    
    const constraints: any = {
      statuses: filters.openOnly ? ['open'] : [],
    };
    
    if (filters.query) {
        if(filters.query === 'good-first') constraints.query = 'good first task';
        if(filters.query === 'bot-dev') constraints.query = 'bots';
    }

    const attachments = {
      projects: 1,
      subscribers: 1,
    };

    let tasks = await searchPhabricatorTasks(constraints, attachments);

    // Server-side filtering
    if (filters.dateRange?.from && filters.dateRange?.to) {
      const fromDate = parseISO(filters.dateRange.from as any);
      const toDate = parseISO(filters.dateRange.to as any);
      tasks = tasks.filter(task => {
        const taskDate = fromUnixTime(task.dateCreated);
        return isWithinInterval(taskDate, { start: fromDate, end: toDate });
      });
    }
    
    if (filters.maxSubscribers !== undefined) {
        if(filters.query !== 'bot-dev') { 
            tasks = tasks.filter(task => task.subscribers <= filters.maxSubscribers);
        }
    }
    
    if (filters.query === 'good-first') {
        tasks = tasks.filter(task => task.subscribers <= 3);
    }

    // AI Language Detection
    tasks = await Promise.all(
      tasks.map(async (task) => {
        const { language } = await detectTaskLanguage({ description: `${task.title} ${task.description}` });
        return { ...task, detectedLanguage: language };
      })
    );

    if (filters.languages && filters.languages.length > 0) {
      tasks = tasks.filter(task => 
        task.detectedLanguage && (filters.languages as string[]).includes(task.detectedLanguage)
      );
    }

    return NextResponse.json(tasks.sort((a, b) => b.dateCreated - a.dateCreated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}