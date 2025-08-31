import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

export async function POST(req: Request) {
  try {
    const { max } = await req.json();
    if (typeof max !== 'number') {
      return NextResponse.json({ error: '"max" is required and must be a number' }, { status: 400 });
    }

    const allOpenTasks = await searchPhabricatorTasks({ statuses: ['open'] }, { projects: 1, subscribers: 1 });
    
    const tasks = allOpenTasks.filter(task => task.subscribers <= max);
    
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
