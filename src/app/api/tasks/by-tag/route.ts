import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

export async function POST(req: Request) {
  try {
    const { tags } = await req.json();
    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'Tags must be a non-empty array' }, { status: 400 });
    }

    const constraints = {
      query: tags.join(' OR '),
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
