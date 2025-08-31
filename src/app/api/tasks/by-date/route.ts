import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';
import { fromUnixTime, isWithinInterval, parseISO } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { from, to } = await req.json();
    if (!from || !to) {
      return NextResponse.json({ error: 'Date range with "from" and "to" is required' }, { status: 400 });
    }

    const allOpenTasks = await searchPhabricatorTasks({ statuses: ['open'] }, { projects: 1, subscribers: 1 });
    
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    const tasks = allOpenTasks.filter(task => {
        const taskDate = fromUnixTime(task.dateCreated);
        return isWithinInterval(taskDate, { start: fromDate, end: toDate });
    });
    
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
