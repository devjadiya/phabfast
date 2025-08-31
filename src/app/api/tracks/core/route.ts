import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

export async function GET() {
  try {
    const constraints = {
      query: 'MediaWiki OR core',
      statuses: ['open'],
    };
    const attachments = { projects: 1, subscribers: 1 };
    const tasks = await searchPhabricatorTasks(constraints, attachments);
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}