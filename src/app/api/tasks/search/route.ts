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

// Mapping from simple query aliases to their stable Phabricator Project PHIDs
const projectPhidMap: Record<string, string> = {
    'good-first': 'PHID-PROJ-cqz2i3rff52i2o4j4m2s', // Good first task
    'bot-dev': 'PHID-PROJ-6k5i2l4w4q2p7k2n4x6e', // Bots
    'core': 'PHID-PROJ-evy6ry35h44jbgyz33mp', // MediaWiki-Core
    'gadgets': 'PHID-PROJ-ylt7fu5sxyuxb3xdrxdi', // MediaWiki-Gadgets
    'web-tools': 'PHID-PROJ-s66yyqj5t4uwx3vjfxqe', // Toolforge
};


export async function POST(req: Request) {
  try {
    const { filters, after, order, limit } = await req.json();
    
    const constraints: any = {};
    const projectConstraints: string[] = [];
    let queryParts: string[] = [];

    if (filters.openOnly) {
        constraints.statuses = ['open'];
    }
    
    if (filters.text) {
        queryParts.push(filters.text);
    }
    
    if (filters.query && projectPhidMap[filters.query]) {
        projectConstraints.push(projectPhidMap[filters.query]);
    }

    if (projectConstraints.length > 0) {
        constraints.projects = projectConstraints;
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

    let { tasks, nextCursor } = await searchPhabricatorTasks(constraints, attachments, after, order, limit);

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
