import { NextResponse, NextRequest } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');

    const constraints: any = {
        statuses: ['open']
    };

    if (tag) {
        constraints.query = tag;
    }

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
