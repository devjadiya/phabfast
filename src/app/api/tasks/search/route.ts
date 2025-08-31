import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

function toEpoch(dateStr: string, endOfDay = false) {
    const date = new Date(dateStr);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const utcDate = new Date(date.getTime() - timezoneOffset);
    
    if (endOfDay) {
      utcDate.setUTCHours(23, 59, 59, 999);
    } else {
      utcDate.setUTCHours(0, 0, 0, 0);
    }
    return Math.floor(utcDate.getTime() / 1000);
}

export async function POST(req: Request) {
  try {
    const { filters, after, order } = await req.json();
    
    const constraints: any = {};
    const queryParts: string[] = [];

    if (filters.openOnly) {
        constraints.statuses = ['open'];
    }
    
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
    
    const attachments = {
      projects: 1,
      subscribers: 1,
    };

    let { tasks, nextCursor } = await searchPhabricatorTasks(constraints, attachments, after, order);

    if (filters.maxSubscribers !== undefined) {
      tasks = tasks.filter(task => task.subscribers <= filters.maxSubscribers);
    }
    
    return NextResponse.json({
        tasks: tasks,
        nextCursor
    });
  } catch (error: any) {
    console.error("Error in /api/tasks/search:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
