import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

export async function GET(req: Request, { params }: { params: { tid: string }}) {
  try {
    const tid = params.tid.startsWith('T') ? params.tid.substring(1) : params.tid;
    
    if (!/^\d+$/.test(tid)) {
        return NextResponse.json({ error: 'Invalid Task ID format' }, { status: 400 });
    }

    const constraints = {
      ids: [parseInt(tid, 10)],
    };
    const attachments = { projects: 1, subscribers: 1 };
    
    const tasks = await searchPhabricatorTasks(constraints, attachments);

    if (tasks.length === 0) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(tasks[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
