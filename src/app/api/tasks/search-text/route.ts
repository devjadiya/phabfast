import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'A "query" string is required' }, { status: 400 });
    }

    const constraints = {
      query: query,
      statuses: ['open'],
    };
    
    const attachments = {
        projects: 1,
        subscribers: 1,
    };

    const tasks = await searchPhabricatorTasks(constraints, attachments);
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
