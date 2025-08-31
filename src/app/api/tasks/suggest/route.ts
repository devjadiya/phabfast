
import { NextResponse } from 'next/server';
import { searchPhabricatorTasks } from '@/lib/phabricator';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || query.length < 2) {
      return NextResponse.json({ tasks: [] });
    }

    const { tasks } = await searchPhabricatorTasks({ query }, {}, undefined, undefined, 5);

    return NextResponse.json({ tasks });

  } catch (error: any) {
    console.error("Error in /api/tasks/suggest:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
