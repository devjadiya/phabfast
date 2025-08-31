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
    
    const queryParts: string[] = [];
    if (filters.text) {
        queryParts.push(filters.text);
    }
    if (filters.query) {
        if(filters.query === 'good-first') queryParts.push('good first task');
        if(filters.query === 'bot-dev') queryParts.push('bots');
        if(filters.query === 'core') queryParts.push('MediaWiki OR core');
        if(filters.query === 'gadgets') queryParts.push('gadget OR template');
        if(filters.query === 'web-tools') queryParts.push('tools OR Toolforge');
    }

    if(queryParts.length > 0) {
        constraints.query = queryParts.join(' ');
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
      tasks = tasks.filter(task => task.subscribers <= filters.maxSubscribers);
    }
    
    // AI Language Detection
    const languageDetectionPromises = tasks.map(task => 
        detectTaskLanguage({ description: `${task.title} ${task.description}` })
    );
    const languageResults = await Promise.all(languageDetectionPromises);

    let tasksWithLanguage = tasks.map((task, index) => ({
        ...task,
        detectedLanguage: languageResults[index].language
    }));


    if (filters.languages && filters.languages.length > 0) {
      tasksWithLanguage = tasksWithLanguage.filter(task => 
        task.detectedLanguage && (filters.languages as string[]).includes(task.detectedLanguage)
      );
    }
    
    // Difficulty filtering would happen here if we had it
    // if (filters.difficulties && filters.difficulties.length > 0) { ... }

    return NextResponse.json(tasksWithLanguage.sort((a, b) => b.dateCreated - a.dateCreated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
