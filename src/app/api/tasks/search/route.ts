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
const projectPhidMap: Record<string, string[]> = {
    'good-first': ['PHID-PROJ-cqz2i3rff52i2o4j4m2s'], // Good first task
    'bot-dev': [
        'PHID-PROJ-cfim5sbsz722ywm4ja6c', // Bots
        'PHID-PROJ-j2b5r2zvvxpfv4pyo5p7', // Pywikibot
        'PHID-PROJ-w3f7swourh32qmdc6jgs'  // Toolforge
    ],
    'core': ['PHID-PROJ-evy6ry35h44jbgyz33mp'], // MediaWiki-Core
    'gadgets': ['PHID-PROJ-ylt7fu5sxyuxb3xdrxdi'], // MediaWiki-Gadgets
    'web-tools': [
        'PHID-PROJ-w3f7swourh32qmdc6jgs', // Toolforge
        'PHID-PROJ-qjddc42on3yqg5da2g43'  // Cloud-Services
    ],
};

const queryToKeyword: Record<string, string> = {
    'bot-dev': 'bot',
    'web-tools': 'web tool',
    'core': 'core',
    'gadgets': 'gadget',
}

export async function POST(req: Request) {
  try {
    const { filters, after, order, limit } = await req.json();
    
    const constraints: any = {};
    
    if (filters.openOnly) {
        constraints.statuses = ['open'];
    }
    
    if (filters.query && projectPhidMap[filters.query]) {
        constraints.projects = projectPhidMap[filters.query];
    }
    
    // Add full text search as a fallback/broadener, especially for tracks
    if (filters.query && queryToKeyword[filters.query]) {
        // If a text filter is also present, combine them.
        constraints.query = filters.text ? `${queryToKeyword[filters.query]} ${filters.text}` : queryToKeyword[filters.query];
    } else if (filters.text) {
        constraints.query = filters.text;
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
