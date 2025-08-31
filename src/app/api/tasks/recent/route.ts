import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

export async function GET() {
  try {
    const constraints = {
      statuses: ['open'],
    };
    
    const attachments = {
      projects: 1,
      subscribers: 1,
    };

    // Phabricator's maniphest.search can be ordered.
    // Let's sort client side for now as the main search endpoint does.
    let tasks = await searchPhabricatorTasks(constraints, attachments);
    tasks = tasks.sort((a, b) => b.dateCreated - a.dateCreated);

    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
