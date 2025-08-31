import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

function toEpoch(dateInput: string | Date, endOfDay = false) {
    if (!dateInput) return null;
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        return null;
    }
    
    const utcDate = new Date(Date.UTC(
        date.getFullYear(), 
        date.getMonth(), 
        date.getDate(),
        endOfDay ? 23 : 0, 
        endOfDay ? 59 : 0, 
        endOfDay ? 59 : 0, 
        endOfDay ? 999 : 0
    ));
    
    return Math.floor(utcDate.getTime() / 1000);
}

// Mapping from simple query aliases to their stable Phabricator Project PHIDs
const projectPhidMap: Record<string, string[]> = {
    'good-first': ['PHID-PROJ-cqz2i3rff52i2o4j4m2s'], // Good first task
    'bot-dev': [
        'PHID-PROJ-cfim5sbsz722ywm4ja6c', // Bots
        'PHID-PROJ-j2b5r2zvvxpfv4pyo5p7', // Pywikibot
        'PHID-PROJ-w3f7swourh32qmdc6jgs',  // Toolforge
        'PHID-PROJ-b3aevxeyvrcx724i27u6', // Bot-Frameworks
        'PHID-PROJ-qjddc42on3yqg5da2g43', // Cloud-Services
        'PHID-PROJ-c46ybasbcjpfzaske7qh', // AutoWikiBrowser
    ],
    'core': [
        'PHID-PROJ-evy6ry35h44jbgyz33mp', // MediaWiki-Core
        'PHID-PROJ-c4ax6usbfzetj3f67i3c', // Action-API
        'PHID-PROJ-uujzuqfajq327gnomrtf', // Database
        'PHID-PROJ-iaak2h2rgyd7wz4vsqw2', // File-Backends
        'PHID-PROJ-xwi6qyae7ndatdsvgvqc', // I18n-L10n
        'PHID-PROJ-mswbzq3medraol2jhto2', // JobQueue
        'PHID-PROJ-p7272t5v7jeihee3cb2m', // Logging
        'PHID-PROJ-xck3caedubz2onjgya4x', // Skins
        'PHID-PROJ-snjwnyaz2u5myo46j5n2', // Caching
        'PHID-PROJ-nwvnhrgs2zwsx2u3b26y', // Security
        'PHID-PROJ-sh7u7afy6v3oiprqge3f', // Performance
    ],
    'gadgets': ['PHID-PROJ-ylt7fu5sxyuxb3xdrxdi'], // MediaWiki-Gadgets
    'web-tools': [
        'PHID-PROJ-w3f7swourh32qmdc6jgs', // Toolforge
        'PHID-PROJ-qjddc42on3yqg5da2g43',  // Cloud-Services
        'PHID-PROJ-ux524wbb2xizbgccjwfq', // Web-platform-team
        'PHID-PROJ-yqnypxfdnzzmsoh6idja', // PAWS
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
    
    let queryPHIDs: string[] = filters.query && projectPhidMap[filters.query] ? projectPhidMap[filters.query] : [];
    let userSelectedPHIDs: string[] = filters.projectPHIDs || [];

    const combinedPHIDs = [...new Set([...queryPHIDs, ...userSelectedPHIDs])];

    if (combinedPHIDs.length > 0) {
        constraints.projects = combinedPHIDs;
    }

    let keywordFromQuery = filters.query && queryToKeyword[filters.query] ? queryToKeyword[filters.query] : '';
    const fullTextQuery = filters.text ? `${keywordFromQuery} ${filters.text}`.trim() : keywordFromQuery;

    if (fullTextQuery) {
        constraints.query = fullTextQuery;
    }
    
    if (filters.dateRange?.from) {
        const createdStart = toEpoch(filters.dateRange.from);
        if (createdStart) constraints.createdStart = createdStart;
    }
    if (filters.dateRange?.to) {
        const createdEnd = toEpoch(filters.dateRange.to, true);
        if (createdEnd) constraints.createdEnd = createdEnd;
    }
    
    const attachments = {
      projects: 1,
      subscribers: 1,
    };

    let { tasks, nextCursor } = await searchPhabricatorTasks(constraints, attachments, after, order, limit);

    if (filters.maxSubscribers !== undefined && filters.maxSubscribers < 20) {
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
