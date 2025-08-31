import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

export async function GET() {
  try {
    const constraints = {
      query: 'good first task',
      statuses: ['open'],
    };
    const attachments = { projects: 1, subscribers: 1 };
    
    let tasks = await searchPhabricatorTasks(constraints, attachments);
    
    // Additional filtering for good first tasks
    tasks = tasks.filter(task => task.subscribers <= 3);

    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
