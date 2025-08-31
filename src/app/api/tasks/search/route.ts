import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';
import type { Filters } from '@/lib/types';

function toEpoch(dateStr: string, endOfDay = false) {
    const date = new Date(dateStr);
    // When a user picks a date like '2023-08-29', it's treated as midnight in their local timezone.
    // To get the UTC day, we need to offset this.
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const utcDate = new Date(date.getTime() + timezoneOffset);
    
    if (endOfDay) {
      utcDate.setUTCHours(23, 59, 59, 999);
    } else {
      utcDate.setUTCHours(0, 0, 0, 0);
    }
    return Math.floor(utcDate.getTime() / 1000);
}

export async function POST(req: Request) {
  try {
    const { filters, after } = await req.json();
    
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
    
    if (filters.dateRange?.from) {
        constraints.createdStart = toEpoch(filters.dateRange.from as any);
    }
    if (filters.dateRange?.to) {
        constraints.createdEnd = toEpoch(filters.dateRange.to as any, true);
    }
    
    if (filters.maxSubscribers !== undefined) {
      // This can't be a constraint, so it will be filtered after fetch.
    }

    const attachments = {
      projects: 1,
      subscribers: 1,
    };

    let { tasks, nextCursor } = await searchPhabricatorTasks(constraints, attachments, after);

    // Post-fetch filtering for subscribers
    if (filters.maxSubscribers !== undefined) {
      tasks = tasks.filter(task => task.subscribers <= filters.maxSubscribers);
    }
    
    return NextResponse.json({
        tasks: tasks.sort((a, b) => b.dateCreated - a.dateCreated),
        nextCursor
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
