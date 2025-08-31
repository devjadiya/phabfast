import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

function toEpoch(dateStr: string, endOfDay = false) {
    const date = new Date(dateStr);
    if (endOfDay) {
      date.setUTCHours(23, 59, 59, 999);
    } else {
      date.setUTCHours(0, 0, 0, 0);
    }
    return Math.floor(date.getTime() / 1000);
}

export async function POST(req: Request) {
  try {
    const { from, to } = await req.json();
    if (!from || !to) {
      return NextResponse.json({ error: 'Date range with "from" and "to" is required' }, { status: 400 });
    }

    const constraints: any = { 
        statuses: ['open'],
        createdStart: toEpoch(from),
        createdEnd: toEpoch(to, true)
    };

    const tasks = await searchPhabricatorTasks(constraints, { projects: 1, subscribers: 1 });
    
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
